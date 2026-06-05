import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  ClipboardList,
  Users,
  Loader2,
  CheckCircle,
  Trash2,
} from "lucide-react";
import API from "../api/axios";

function TeacherDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [selectedFile, setSelectedFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [message, setMessage] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const fetchDashboardData = async () => {
    try {
      const [documentsRes, quizzesRes, statsRes] = await Promise.all([
        API.get("/documents/"),
        API.get("/quiz/"),
        API.get("/auth/stats"),
      ]);

      setDocuments(documentsRes.data.documents || []);
      setQuizzes(quizzesRes.data.quizzes || []);
      setStudentCount(statsRes.data.total_students || 0);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      setMessage("Please select a valid PDF file.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setMessage("");
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setMessage("Please select a PDF file first.");
      return;
    }

    try {
      setUploading(true);
      setMessage("Uploading PDF and creating embeddings. Please wait...");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await API.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(res.data.message);
      setSelectedFile(null);

      const fileInput = document.getElementById("pdfFileInput");

      if (fileInput) {
        fileInput.value = "";
      }

      fetchDashboardData();
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.detail || "PDF upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId, title) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this document?\n\n${title}`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(documentId);
      setMessage("Deleting document and Pinecone vectors. Please wait...");

      const res = await API.delete(`/documents/${documentId}`);

      setMessage(res.data.message);
      fetchDashboardData();
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.detail || "Document deletion failed.");
    } finally {
      setDeletingId(null);
    }
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
        <div
          onClick={() => navigate("/teacher/materials")}
          className="bg-white rounded-2xl shadow p-6 cursor-pointer hover:shadow-lg transition"
        >
          <div className="text-indigo-600 mb-4">
            <FileText />
          </div>

          <h3 className="text-slate-500">Documents</h3>

          <p className="text-3xl font-bold text-slate-800 mt-2">
            {documents.length}
          </p>

          <p className="text-sm text-indigo-600 mt-3">View materials</p>
        </div>

        <DashboardCard
          icon={<ClipboardList />}
          title="Quizzes"
          value={quizzes.length}
        />

        <DashboardCard icon={<Users />} title="Students" value={studentCount} />

        <DashboardCard
          icon={<Upload />}
          title="Uploads"
          value={documents.length}
        />
      </div>

      <div className="px-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            Upload Study Materials
          </h2>

          <p className="text-slate-500 mb-5">
            Upload PDF documents. The backend will extract text, create
            embeddings, and store vectors in Pinecone for the RAG system.
          </p>

          <div className="border-2 border-dashed border-indigo-300 rounded-2xl p-6 text-center bg-indigo-50/50">
            <Upload className="mx-auto text-indigo-600 mb-3" size={36} />

            <input
              id="pdfFileInput"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="w-full text-sm text-slate-600"
            />

            {selectedFile && (
              <p className="mt-3 text-sm text-slate-700">
                Selected:{" "}
                <span className="font-medium">{selectedFile.name}</span>
              </p>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="mt-5 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload PDF
              </>
            )}
          </button>

          {message && (
            <div className="mt-5 bg-slate-100 text-slate-700 px-4 py-3 rounded-xl">
              {message}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            Generate AI Quiz
          </h2>

          <p className="text-slate-500 mb-5">
            Generate quizzes automatically from uploaded study materials using
            AI.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/teacher/generate-quiz")}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700"
            >
              Generate Quiz
            </button>

            <button
              onClick={() => navigate("/teacher/quizzes")}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
            >
              Manage Quizzes
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            Student Reports
          </h2>

          <p className="text-slate-500 mb-5">
            View student quiz attempts, scores, percentages, and learning
            progress.
          </p>

          <button
            onClick={() => navigate("/teacher/reports")}
            className="bg-slate-800 text-white px-6 py-3 rounded-xl hover:bg-slate-900"
          >
            View Reports
          </button>
        </div>
      </div>

      <div className="p-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-5">
            Uploaded Documents
          </h2>

          {documents.length === 0 ? (
            <p className="text-slate-500">No documents uploaded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="py-3">Document</th>
                    <th className="py-3">Chunks</th>
                    <th className="py-3">Vectors</th>
                    <th className="py-3">Characters</th>
                    <th className="py-3">Uploaded By</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b">
                      <td className="py-4 font-medium text-slate-800">
                        {doc.title}
                      </td>

                      <td className="py-4">{doc.total_chunks}</td>
                      <td className="py-4">{doc.vectors_stored}</td>
                      <td className="py-4">{doc.total_characters}</td>
                      <td className="py-4">{doc.uploaded_by_name}</td>

                      <td className="py-4">
                        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm inline-flex items-center gap-1">
                          <CheckCircle size={14} />
                          Processed
                        </span>
                      </td>

                      <td className="py-4">
                        <button
                          onClick={() =>
                            handleDeleteDocument(doc.id, doc.title)
                          }
                          disabled={deletingId === doc.id}
                          className="bg-red-50 text-red-600 px-3 py-2 rounded-xl hover:bg-red-100 disabled:opacity-50 inline-flex items-center gap-2"
                        >
                          {deletingId === doc.id ? (
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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