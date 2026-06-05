import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ClipboardList, Loader2 } from "lucide-react";
import API from "../api/axios";

function StudentQuizzes() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await API.get("/quiz/");
      setQuizzes(res.data.quizzes || []);
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.detail || "Failed to load quizzes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

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
            Available Quizzes
          </h1>
          <p className="text-slate-500">
            Select a quiz and test your knowledge.
          </p>
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto">
        {loading ? (
          <div className="bg-white rounded-2xl shadow p-8 flex items-center gap-3">
            <Loader2 className="animate-spin text-indigo-600" />
            <p className="text-slate-600">Loading quizzes...</p>
          </div>
        ) : message ? (
          <div className="bg-red-50 text-red-600 rounded-2xl p-5">
            {message}
          </div>
        ) : quizzes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <ClipboardList className="mx-auto text-slate-400 mb-4" size={42} />
            <h2 className="text-xl font-bold text-slate-800">
              No quizzes available
            </h2>
            <p className="text-slate-500 mt-2">
              Ask your teacher to generate a quiz first.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl shadow p-6 border border-slate-100"
              >
                <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <ClipboardList />
                </div>

                <h2 className="text-xl font-bold text-slate-800">
                  {quiz.title}
                </h2>

                <p className="text-slate-500 mt-2">
                  Topic: {quiz.topic}
                </p>

                <p className="text-slate-500 mt-1">
                  Questions: {quiz.num_questions}
                </p>

                <p className="text-slate-400 text-sm mt-1">
                  Created by: {quiz.created_by_name}
                </p>

                <button
                  onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                  className="mt-5 bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700"
                >
                  Attempt Quiz
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentQuizzes;