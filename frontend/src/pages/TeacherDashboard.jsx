import { useNavigate } from "react-router-dom";
import { Upload, FileText, ClipboardList, Users } from "lucide-react";

function TeacherDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Teacher Dashboard
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
        <DashboardCard icon={<FileText />} title="Documents" value="0" />
        <DashboardCard icon={<ClipboardList />} title="Quizzes" value="0" />
        <DashboardCard icon={<Users />} title="Students" value="0" />
        <DashboardCard icon={<Upload />} title="Uploads" value="0" />
      </div>

      <div className="px-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            Upload Study Materials
          </h2>

          <p className="text-slate-500 mb-5">
            Upload PDF documents. Later, the system will extract text, generate
            embeddings, and store them in Pinecone.
          </p>

          <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700">
            Upload PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            Generate AI Quiz
          </h2>

          <p className="text-slate-500 mb-5">
            Generate quizzes automatically from uploaded study materials.
          </p>

          <button className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700">
            Generate Quiz
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

export default TeacherDashboard;