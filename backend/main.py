from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, Integer
from sqlalchemy.orm import declarative_base, sessionmaker
from hashlib import sha256
from jose import jwt
import subprocess, uuid, os, random

# OPTIONAL GPT
USE_GPT = False   # 👉 change to True if you add API key

if USE_GPT:
    import openai
    openai.api_key = "YOUR_API_KEY"

# ---------------- CONFIG ----------------
SECRET_KEY = "secret123"
ALGORITHM = "HS256"

# ---------------- DATABASE ----------------
DATABASE_URL = "sqlite:///./users.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# ---------------- TABLES ----------------

class User(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True)
    password = Column(String)

class Result(Base):
    __tablename__ = "results"
    id = Column(Integer, primary_key=True)
    email = Column(String)
    question = Column(String)
    score = Column(Integer)

Base.metadata.create_all(bind=engine)

# ---------------- PASSWORD ----------------

def hash_password(password):
    return sha256(password.encode()).hexdigest()

def verify_password(plain, hashed):
    return sha256(plain.encode()).hexdigest() == hashed

# ---------------- TOKEN ----------------

def create_token(email):
    return jwt.encode({"email": email}, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

# ---------------- APP ----------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- AUTH ----------------

@app.post("/register")
def register(data: dict):
    db = SessionLocal()

    if db.query(User).filter(User.email == data["email"]).first():
        raise HTTPException(status_code=400, detail="User exists")

    db.add(User(email=data["email"], password=hash_password(data["password"])))
    db.commit()
    db.close()

    return {"message": "Registered"}

@app.post("/login")
def login(data: dict):
    db = SessionLocal()

    user = db.query(User).filter(User.email == data["email"]).first()

    if not user or not verify_password(data["password"], user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user.email)
    return {"access_token": token}

# ---------------- QUESTIONS ----------------

questions = [
    "Write a Python function to reverse a string.",
    "Check if a string is palindrome.",
    "Find factorial of a number.",
    "Find maximum element in a list."
]

@app.get("/question")
def get_question():
    return {"question": random.choice(questions)}

# ---------------- RUN CODE ----------------

@app.post("/run-code")
def run_code(data: dict):
    filename = f"temp_{uuid.uuid4().hex}.py"

    try:
        with open(filename, "w") as f:
            f.write(data["code"])

        result = subprocess.run(
            ["python", filename],
            capture_output=True,
            text=True,
            timeout=5
        )

        return {"output": result.stdout, "error": result.stderr}

    finally:
        if os.path.exists(filename):
            os.remove(filename)

# ---------------- AI EVALUATION ----------------

@app.post("/ai-evaluate")
def ai_evaluate(data: dict):
    code = data["code"]
    question = data["question"]
    token = data["token"]

    try:
        user = decode_token(token)
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

    # -------- GPT MODE --------
    if USE_GPT:
        prompt = f"""
        Question: {question}
        Code: {code}

        Evaluate:
        - Score out of 10
        - Feedback
        - Time complexity
        """

        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )

        result = response["choices"][0]["message"]["content"]
        score = random.randint(6, 10)

    # -------- NORMAL MODE --------
    else:
        score = 0
        if "def" in code: score += 3
        if "for" in code or "while" in code: score += 3
        if "return" in code: score += 2
        if len(code) > 20: score += 2

        result = "Good attempt" if score >= 6 else "Needs improvement"

    # save result
    db = SessionLocal()
    db.add(Result(email=user["email"], question=question, score=score))
    db.commit()
    db.close()

    return {"result": result, "score": score}

# ---------------- HISTORY ----------------

@app.get("/history")
def history(token: str):
    user = decode_token(token)

    db = SessionLocal()
    results = db.query(Result).filter(Result.email == user["email"]).all()

    return [{"question": r.question, "score": r.score} for r in results]

# ---------------- RESUME QUESTIONS ----------------

@app.post("/resume-question")
def resume_question(data: dict):
    skills = data["skills"]

    if USE_GPT:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{
                "role": "user",
                "content": f"Generate interview questions for: {skills}"
            }]
        )
        return {"questions": response["choices"][0]["message"]["content"]}

    # fallback
    return {
        "questions": f"""
        1. Explain basics of {skills}
        2. Write code related to {skills}
        3. Real-world use of {skills}
        """
    }