import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  ClipboardList,
  Users,
  Loader2,
  CheckCircle,
} from "lucide-react";
import API from "../api/axios";

function TeacherDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [selectedFile, setSelectedFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const fetchDocuments = async () => {
    try {
      const res = await API.get("/documents/");
      setDocuments(res.data.documents);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDocuments();
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
      setMessage("");

      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await API.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage(res.data.message);
      setSelectedFile(null);

      document.getElementById("pdfFileInput").value = "";

      fetchDocuments();
    } catch (error) {
      console.error(error);

      if (error.response?.data?.detail) {
        setMessage(error.response.data.detail);
      } else {
        setMessage("PDF upload failed.");
      }
    } finally {
      setUploading(false);
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
        <DashboardCard
          icon={<FileText />}
          title="Documents"
          value={documents.length}
        />
        <DashboardCard icon={<ClipboardList />} title="Quizzes" value="0" />
        <DashboardCard icon={<Users />} title="Students" value="0" />
        <DashboardCard icon={<Upload />} title="Uploads" value={documents.length} />
      </div>

      <div className="px-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-3">
            Upload Study Materials
          </h2>

          <p className="text-slate-500 mb-5">
            Upload PDF documents. The backend will extract text and split the
            content into chunks for the RAG system.
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
                Selected: <span className="font-medium">{selectedFile.name}</span>
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
            Later, you will generate quizzes automatically from uploaded study
            materials.
          </p>

          <button className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700">
            Generate Quiz
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
                    <th className="py-3">Characters</th>
                    <th className="py-3">Uploaded By</th>
                    <th className="py-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b">
                      <td className="py-4 font-medium text-slate-800">
                        {doc.title}
                      </td>
                      <td className="py-4">{doc.total_chunks}</td>
                      <td className="py-4">{doc.total_characters}</td>
                      <td className="py-4">{doc.uploaded_by_name}</td>
                      <td className="py-4">
                        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm inline-flex items-center gap-1">
                          <CheckCircle size={14} />
                          Processed
                        </span>
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