import { useState } from "react";

export default function VoiceInterview() {
  const [text, setText] = useState("");

  const startListening = () => {
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
    };

    recognition.start();
  };

  const speakQuestion = () => {
    const msg = new SpeechSynthesisUtterance("Tell me about yourself");
    window.speechSynthesis.speak(msg);
  };

  return (
    <div>
      <h2>Voice Interview</h2>

      <button onClick={speakQuestion}>Ask Question</button>
      <button onClick={startListening}>Start Answer</button>

      <p><b>Your Answer:</b> {text}</p>
    </div>
  );
}