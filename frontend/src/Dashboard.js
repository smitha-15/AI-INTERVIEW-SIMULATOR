import CodeEditor from "./CodeEditor";
import Analytics from "./Analytics";
import VoiceInterview from "./VoiceInterview";

export default function Dashboard({ setPage }) {

  const logout = () => {
    localStorage.removeItem("token");
    setPage("login");
  };

  return (
    <div>
      <h2>AI Interview Simulator</h2>

      <CodeEditor />

      <hr />

      <Analytics />

      <hr />

      <VoiceInterview />

      <br />
      <button onClick={logout}>Logout</button>
    </div>
  );
}