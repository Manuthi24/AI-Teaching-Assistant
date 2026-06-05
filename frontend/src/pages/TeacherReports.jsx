import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  Loader2,
  Users,
  ClipboardCheck,
} from "lucide-react";
import API from "../api/axios";

function TeacherReports() {
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchAttempts = async () => {
    try {
      setLoading(true);

      const res = await API.get("/quiz/attempts/all");
      setAttempts(res.data.attempts || []);
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.detail || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  const averageScore =
    attempts.length > 0
      ? Math.round(
          attempts.reduce(
            (sum, attempt) => sum + Number(attempt.percentage || 0),
            0
          ) / attempts.length
        )
      : 0;

  const uniqueStudents = new Set(
    attempts.map((attempt) => attempt.student_email)
  ).size;

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
            Student Performance Reports
          </h1>
          <p className="text-slate-500">
            View quiz attempts, scores, and student progress.
          </p>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto">
        {loading ? (
          <div className="bg-white rounded-2xl shadow p-8 flex items-center gap-3">
            <Loader2 className="animate-spin text-indigo-600" />
            <p className="text-slate-600">Loading reports...</p>
          </div>
        ) : message ? (
          <div className="bg-red-50 text-red-600 rounded-2xl p-5">
            {message}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <ReportCard
                icon={<ClipboardCheck />}
                title="Total Attempts"
                value={attempts.length}
              />

              <ReportCard
                icon={<Users />}
                title="Students Attempted"
                value={uniqueStudents}
              />

              <ReportCard
                icon={<Trophy />}
                title="Average Score"
                value={`${averageScore}%`}
              />
            </div>

            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-5">
                Quiz Attempt Records
              </h2>

              {attempts.length === 0 ? (
                <p className="text-slate-500">
                  No quiz attempts available yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b text-slate-500">
                        <th className="py-3">Student</th>
                        <th className="py-3">Email</th>
                        <th className="py-3">Quiz</th>
                        <th className="py-3">Score</th>
                        <th className="py-3">Percentage</th>
                        <th className="py-3">Attempted At</th>
                      </tr>
                    </thead>

                    <tbody>
                      {attempts.map((attempt, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-4 font-medium text-slate-800">
                            {attempt.student_name}
                          </td>

                          <td className="py-4 text-slate-600">
                            {attempt.student_email}
                          </td>

                          <td className="py-4">{attempt.quiz_title}</td>

                          <td className="py-4">
                            {attempt.score}/{attempt.total}
                          </td>

                          <td className="py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                attempt.percentage >= 75
                                  ? "bg-green-50 text-green-700"
                                  : attempt.percentage >= 50
                                  ? "bg-yellow-50 text-yellow-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {attempt.percentage}%
                            </span>
                          </td>

                          <td className="py-4 text-slate-500">
                            {new Date(attempt.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReportCard({ icon, title, value }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="text-indigo-600 mb-4">{icon}</div>
      <h3 className="text-slate-500">{title}</h3>
      <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
    </div>
  );
}

export default TeacherReports;