import { useEffect, useState } from "react";
import API from "./api/axios";

function App() {
  const [message, setMessage] = useState("Connecting to backend...");

  useEffect(() => {
    API.get("/")
      .then((res) => {
        setMessage(res.data.message);
      })
      .catch(() => {
        setMessage("Backend not connected");
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white p-10 rounded-2xl shadow-xl text-center">
        <h1 className="text-4xl font-bold text-indigo-600">
          AI Teaching Assistant
        </h1>

        <p className="mt-4 text-slate-600">
          Full-stack RAG-based learning platform
        </p>

        <div className="mt-6 bg-indigo-50 text-indigo-700 px-5 py-3 rounded-xl">
          {message}
        </div>
      </div>
    </div>
  );
}

export default App;