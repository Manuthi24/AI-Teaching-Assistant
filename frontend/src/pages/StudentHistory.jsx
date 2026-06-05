import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  Trophy,
  Loader2,
  ClipboardCheck,
} from "lucide-react";
import API from "../api/axios";

function StudentHistory() {
  const navigate = useNavigate();

  const [chatHistory, setChatHistory] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchHistory = async () => {
    try {
      setLoading(true);

      const [chatRes, quizRes] = await Promise.all([
        API.get("/chat/history"),
        API.get("/quiz/attempts/history"),
      ]);

      setChatHistory(chatRes.data.history || []);
      setQuizHistory(quizRes.data.history || []);
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.detail || "Failed to load history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const averageScore =
    quizHistory.length > 0
      ? Math.round(
          quizHistory.reduce(
            (sum, attempt) => sum + Number(attempt.percentage || 0),
            0
          ) / quizHistory.length
        )
      : 0;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={() => navigate("/student/dashboard")}
          className="text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Learning History
          </h1>
          <p className="text-slate-500">
            Review your AI chats and quiz performance.
          </p>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto">
        {loading ? (
          <div className="bg-white rounded-2xl shadow p-8 flex items-center gap-3">
            <Loader2 className="animate-spin text-indigo-600" />
            <p className="text-slate-600">Loading history...</p>
          </div>
        ) : message ? (
          <div className="bg-red-50 text-red-600 rounded-2xl p-5">
            {message}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <SummaryCard
                icon={<MessageCircle />}
                title="AI Chats"
                value={chatHistory.length}
              />

              <SummaryCard
                icon={<ClipboardCheck />}
                title="Quiz Attempts"
                value={quizHistory.length}
              />

              <SummaryCard
                icon={<Trophy />}
                title="Average Score"
                value={`${averageScore}%`}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <MessageCircle className="text-indigo-600" />
                  AI Chat History
                </h2>

                {chatHistory.length === 0 ? (
                  <p className="text-slate-500">No chat history yet.</p>
                ) : (
                  <div className="space-y-5 max-h-[650px] overflow-y-auto pr-2">
                    {chatHistory.map((chat, index) => (
                      <div
                        key={index}
                        className="border border-slate-200 rounded-xl p-4"
                      >
                        <p className="font-semibold text-slate-800">
                          Q: {chat.question}
                        </p>

                        <p className="text-slate-600 mt-3 whitespace-pre-line">
                          {chat.answer}
                        </p>

                        <p className="text-xs text-slate-400 mt-3">
                          {new Date(chat.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
                  <Trophy className="text-yellow-600" />
                  Quiz Attempt History
                </h2>

                {quizHistory.length === 0 ? (
                  <p className="text-slate-500">No quiz attempts yet.</p>
                ) : (
                  <div className="space-y-5 max-h-[650px] overflow-y-auto pr-2">
                    {quizHistory.map((attempt, index) => (
                      <div
                        key={index}
                        className="border border-slate-200 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="font-bold text-slate-800">
                              {attempt.quiz_title}
                            </h3>

                            <p className="text-slate-500 text-sm mt-1">
                              Score: {attempt.score}/{attempt.total}
                            </p>
                          </div>

                          <div
                            className={`px-4 py-2 rounded-full font-bold ${
                              attempt.percentage >= 75
                                ? "bg-green-50 text-green-700"
                                : attempt.percentage >= 50
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {attempt.percentage}%
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 mt-3">
                          {new Date(attempt.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ icon, title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="text-indigo-600 mb-4">{icon}</div>
      <h3 className="text-slate-500">{title}</h3>
      <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
    </div>
  );
}

export default StudentHistory;