import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Loader2, ArrowLeft } from "lucide-react";
import API from "../api/axios";

function StudentChat() {
  const navigate = useNavigate();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) {
      return;
    }

    try {
      setLoading(true);
      setAnswer("");
      setSources([]);

      const res = await API.post("/chat/ask", {
        question: question,
      });

      setAnswer(res.data.answer);
      setSources(res.data.sources || []);
    } catch (error) {
      console.error(error);
      setAnswer(error.response?.data?.detail || "Failed to get answer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/student/dashboard")}
          className="text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            AI Chat Assistant
          </h1>
          <p className="text-slate-500">
            Ask questions from uploaded study materials.
          </p>
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Your Question
          </label>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows="4"
            placeholder="Example: What is artificial intelligence?"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            onClick={handleAsk}
            disabled={loading}
            className="mt-4 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Thinking...
              </>
            ) : (
              <>
                <Send size={18} />
                Ask AI
              </>
            )}
          </button>
        </div>

        {answer && (
          <div className="bg-white rounded-2xl shadow p-6 mt-6">
            <h2 className="text-xl font-bold text-slate-800 mb-3">
              AI Answer
            </h2>

            <p className="text-slate-700 whitespace-pre-line leading-relaxed">
              {answer}
            </p>
          </div>
        )}

        {sources.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6 mt-6">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Retrieved Sources
            </h2>

            <div className="space-y-4">
              {sources.map((source, index) => (
                <div
                  key={index}
                  className="border border-slate-200 rounded-xl p-4"
                >
                  <p className="font-medium text-slate-800">
                    {source.title}
                  </p>

                  <p className="text-sm text-slate-500 mt-1">
                    Chunk {source.chunk_index} | Score:{" "}
                    {Number(source.score).toFixed(3)}
                  </p>

                  <p className="text-slate-600 text-sm mt-3">
                     {source.text?.slice(0, 350)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentChat;