import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import API from "../api/axios";

function TeacherQuizzes() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await API.get("/quiz/");
      setQuizzes(res.data.quizzes || []);
    } catch (error) {
      console.error(error);
      setMessageType("error");
      setMessage(error.response?.data?.detail || "Failed to load quizzes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleDeleteQuiz = async (quizId, title) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this quiz?\n\n${title}\n\nStudents will no longer see this quiz.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(quizId);
      setMessage("");

      const res = await API.delete(`/quiz/${quizId}`);

      setMessageType("success");
      setMessage(res.data.message || "Quiz deleted successfully.");

      await fetchQuizzes();
    } catch (error) {
      console.error(error);
      setMessageType("error");
      setMessage(error.response?.data?.detail || "Quiz deletion failed.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={() => navigate("/teacher/dashboard")}
          className="text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Manage Quizzes
          </h1>
          <p className="text-slate-500">
            View, update, and delete AI-generated quizzes.
          </p>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto">
        {message && (
          <div
            className={`mb-5 px-4 py-3 rounded-xl border ${
              messageType === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl shadow p-8 flex items-center gap-3">
            <Loader2 className="animate-spin text-indigo-600" />
            <p className="text-slate-600">Loading quizzes...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <ClipboardList className="mx-auto text-slate-400 mb-4" size={42} />
            <h2 className="text-xl font-bold text-slate-800">
              No quizzes available
            </h2>
            <p className="text-slate-500 mt-2">
              Generate a quiz first before managing.
            </p>

            <button
              onClick={() => navigate("/teacher/generate-quiz")}
              className="mt-5 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700"
            >
              Generate Quiz
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-800">
                Generated Quizzes
              </h2>

              <button
                onClick={() => navigate("/teacher/generate-quiz")}
                className="bg-purple-600 text-white px-5 py-2 rounded-xl hover:bg-purple-700"
              >
                Generate New Quiz
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="py-3">Title</th>
                    <th className="py-3">Topic</th>
                    <th className="py-3">Questions</th>
                    <th className="py-3">Created By</th>
                    <th className="py-3">Created At</th>
                    <th className="py-3">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {quizzes.map((quiz) => (
                    <tr key={quiz.id} className="border-b">
                      <td className="py-4 font-medium text-slate-800">
                        {quiz.title}
                      </td>

                      <td className="py-4 text-slate-600">
                        {quiz.topic}
                      </td>

                      <td className="py-4">
                        {quiz.num_questions}
                      </td>

                      <td className="py-4 text-slate-600">
                        {quiz.created_by_name}
                      </td>

                      <td className="py-4 text-slate-500">
                        {quiz.created_at
                          ? new Date(quiz.created_at).toLocaleString()
                          : "N/A"}
                      </td>

                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() =>
                              navigate(`/teacher/quiz/edit/${quiz.id}`)
                            }
                            className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-100 inline-flex items-center gap-2"
                          >
                            <Pencil size={16} />
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteQuiz(quiz.id, quiz.title)
                            }
                            disabled={deletingId === quiz.id}
                            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 disabled:opacity-50 inline-flex items-center gap-2"
                          >
                            {deletingId === quiz.id ? (
                              <>
                                <Loader2 className="animate-spin" size={16} />
                                Deleting
                              </>
                            ) : (
                              <>
                                <Trash2 size={16} />
                                Delete
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherQuizzes;