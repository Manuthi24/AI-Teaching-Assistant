import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Eye,
  X,
  MessageCircle,
  ClipboardList,
} from "lucide-react";
import API from "../api/axios";

function StudyMaterials() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [message, setMessage] = useState("");

  const dashboardPath =
    user?.role === "teacher" ? "/teacher/dashboard" : "/student/dashboard";

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await API.get("/documents/");
      setDocuments(res.data.documents || []);
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.detail || "Failed to load study materials."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handlePreview = async (document) => {
    try {
      setPreviewLoading(true);
      setSelectedDocument(document);
      setPreview(null);
      setMessage("");

      const res = await API.get(`/documents/${document.id}/preview`);
      setPreview(res.data);
    } catch (error) {
      console.error(error);
      setMessage(
        error.response?.data?.detail || "Failed to load document preview."
      );
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setSelectedDocument(null);
    setPreview(null);
  };

  const goToStudentChat = () => {
    navigate("/student/chat", {
      state: {
        selectedDocumentId: selectedDocument.id,
      },
    });
  };

  const goToGenerateQuiz = () => {
    navigate("/teacher/generate-quiz", {
      state: {
        selectedDocumentId: selectedDocument.id,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={() => navigate(dashboardPath)}
          className="text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Study Materials
          </h1>
          <p className="text-slate-500">
            View uploaded PDFs and preview extracted text chunks.
          </p>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto">
        {message && (
          <div className="mb-5 bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl">
            {message}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl shadow p-8 flex items-center gap-3">
            <Loader2 className="animate-spin text-indigo-600" />
            <p className="text-slate-600">Loading study materials...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center">
            <FileText className="mx-auto text-slate-400 mb-4" size={46} />

            <h2 className="text-xl font-bold text-slate-800">
              No study materials available
            </h2>

            <p className="text-slate-500 mt-2">
              Ask a teacher to upload PDF study materials first.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-5">
              Uploaded Documents
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b text-slate-500">
                    <th className="py-3">Document</th>
                    <th className="py-3">Chunks</th>
                    <th className="py-3">Vectors</th>
                    <th className="py-3">Characters</th>
                    <th className="py-3">Uploaded By</th>
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

                      <td className="py-4 text-slate-600">
                        {doc.uploaded_by_name}
                      </td>

                      <td className="py-4">
                        <button
                          onClick={() => handlePreview(doc)}
                          className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl hover:bg-indigo-100 inline-flex items-center gap-2"
                        >
                          <Eye size={16} />
                          Preview
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedDocument && (
          <div className="bg-white rounded-2xl shadow p-6 mt-6">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Document Preview
                </h2>

                <p className="text-slate-500 mt-1">
                  {selectedDocument.title}
                </p>
              </div>

              <button
                onClick={closePreview}
                className="bg-slate-100 text-slate-600 p-2 rounded-xl hover:bg-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            {previewLoading ? (
              <div className="flex items-center gap-3 text-slate-600">
                <Loader2 className="animate-spin text-indigo-600" />
                Loading preview...
              </div>
            ) : preview ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <InfoCard title="Total Chunks" value={preview.total_chunks} />

                  <InfoCard
                    title="Vectors Stored"
                    value={preview.vectors_stored}
                  />

                  <InfoCard
                    title="Preview Chunks"
                    value={preview.preview_chunks.length}
                  />
                </div>

                <div className="space-y-4">
                  {preview.preview_chunks.map((chunk, index) => (
                    <div
                      key={index}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50"
                    >
                      <p className="font-medium text-slate-800 mb-2">
                        Chunk Preview {index + 1}
                      </p>

                      <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                        {chunk}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {user?.role === "student" && (
                    <button
                      onClick={goToStudentChat}
                      className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 inline-flex items-center gap-2"
                    >
                      <MessageCircle size={18} />
                      Ask AI
                    </button>
                  )}

                  {user?.role === "teacher" && (
                    <button
                      onClick={goToGenerateQuiz}
                      className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 inline-flex items-center gap-2"
                    >
                      <ClipboardList size={18} />
                      Generate Quiz
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, value }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <p className="text-slate-500 text-sm">{title}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
  );
}

export default StudyMaterials;