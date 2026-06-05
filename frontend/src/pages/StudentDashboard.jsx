import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  BookOpen,
  ClipboardCheck,
  Trophy,
  History,
} from "lucide-react";
import API from "../api/axios";

function StudentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [documentsCount, setDocumentsCount] = useState(0);
  const [chatCount, setChatCount] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [averageScore, setAverageScore] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const fetchDashboardData = async () => {
    try {
      const [documentsRes, chatsRes, quizzesRes, attemptsRes] =
        await Promise.all([
          API.get("/documents/"),
          API.get("/chat/history"),
          API.get("/quiz/"),
          API.get("/quiz/attempts/history"),
        ]);

      const documents = documentsRes.data.documents || [];
      const chats = chatsRes.data.history || [];
      const quizzes = quizzesRes.data.quizzes || [];
      const attempts = attemptsRes.data.history || [];

      setDocumentsCount(documents.length);
      setChatCount(chats.length);
      setQuizCount(quizzes.length);

      if (attempts.length > 0) {
        const totalPercentage = attempts.reduce(
          (sum, attempt) => sum + Number(attempt.percentage || 0),
          0
        );

        setAverageScore(Math.round(totalPercentage / attempts.length));
      } else {
        setAverageScore(0);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Student Dashboard
          </h1>
          <p className="text-slate-500">Welcome, {user?.name}</p>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-5 py-2 rounded-xl hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div
          onClick={() => navigate("/student/materials")}
          className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-lg transition"
        >
          <div className="text-indigo-600 mb-4">
            <BookOpen />
          </div>

          <h3 className="text-slate-500">Study Materials</h3>

          <p className="text-3xl font-bold text-slate-800 mt-2">
            {documentsCount}
          </p>

          <p className="text-sm text-indigo-600 mt-3">View materials</p>
        </div>

        <DashboardCard
          icon={<MessageCircle />}
          title="AI Chats"
          value={chatCount}
        />

        <DashboardCard
          icon={<ClipboardCheck />}
          title="Quizzes"
          value={quizCount}
        />

        <DashboardCard
          icon={<Trophy />}
          title="Average Score"
          value={`${averageScore}%`}
        />
      </div>

      <div className="px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            Ask AI Assistant
          </h2>

          <p className="text-slate-500 mb-5">
            Ask questions from uploaded study materials using RAG-based AI chat.
          </p>

          <button
            onClick={() => navigate("/student/chat")}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
          >
            Start Chat
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            Attempt Quiz
          </h2>

          <p className="text-slate-500 mb-5">
            Take AI-generated quizzes and track your score history.
          </p>

          <button
            onClick={() => navigate("/student/quizzes")}
            className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700"
          >
            View Quizzes
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            Learning History
          </h2>

          <p className="text-slate-500 mb-5">
            View your previous AI chats, quiz attempts, scores, and progress.
          </p>

          <button
            onClick={() => navigate("/student/history")}
            className="bg-slate-800 text-white px-6 py-3 rounded-xl hover:bg-slate-900 inline-flex items-center gap-2"
          >
            <History size={18} />
            View History
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ icon, title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="text-indigo-600 mb-4">{icon}</div>
      <h3 className="text-slate-500">{title}</h3>
      <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
    </div>
  );
}

export default StudentDashboard;