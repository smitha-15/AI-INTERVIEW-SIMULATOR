import { useState, useEffect } from "react";

export default function CodeEditor() {
  const [code, setCode] = useState("");
  const [question, setQuestion] = useState("");
  const [output, setOutput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [skills, setSkills] = useState("");
  const [resumeQs, setResumeQs] = useState("");
  const [history, setHistory] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/question")
      .then(res => res.json())
      .then(data => setQuestion(data.question));

    fetch("http://127.0.0.1:8000/history?token=" + token)
      .then(res => res.json())
      .then(data => setHistory(data));
  }, []);

  const runCode = async () => {
    const res = await fetch("http://127.0.0.1:8000/run-code", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ code })
    });

    const data = await res.json();
    setOutput(data.output || data.error);
  };

  const evaluate = async () => {
    const res = await fetch("http://127.0.0.1:8000/ai-evaluate", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ code, question, token })
    });

    const data = await res.json();
    setFeedback(`Score: ${data.score}\n${data.result}`);
  };

  const getResumeQs = async () => {
    const res = await fetch("http://127.0.0.1:8000/resume-question", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ skills })
    });

    const data = await res.json();
    setResumeQs(data.questions);
  };

  return (
    <div>
      <h2>AI Interview</h2>

      <h4>{question}</h4>

      <textarea
        rows="10"
        cols="60"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />

      <br /><br />

      <button onClick={runCode}>Run</button>
      <button onClick={evaluate}>Evaluate</button>

      <h4>Output:</h4>
      <pre>{output}</pre>

      <h4>Feedback:</h4>
      <pre>{feedback}</pre>

      <hr />

      <h3>Resume Based Questions</h3>

      <input
        placeholder="Enter skills (Python, SQL)"
        value={skills}
        onChange={(e) => setSkills(e.target.value)}
      />

      <button onClick={getResumeQs}>Generate</button>

      <pre>{resumeQs}</pre>

      <hr />

      <h3>History</h3>

      {history.map((h, i) => (
        <div key={i}>
          <p>{h.question}</p>
          <p>Score: {h.score}</p>
        </div>
      ))}
    </div>
  );
}