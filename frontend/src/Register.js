import { useState } from "react";

export default function Register({ setPage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const register = async () => {
    const res = await fetch("http://127.0.0.1:8000/register", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    alert(data.message || data.detail);
    setPage("login");
  };

  return (
    <div>
      <h2>Register</h2>

      <input onChange={e => setEmail(e.target.value)} placeholder="Email" />
      <br /><br />

      <input type="password" onChange={e => setPassword(e.target.value)} placeholder="Password" />
      <br /><br />

      <button onClick={register}>Register</button>
    </div>
  );
}