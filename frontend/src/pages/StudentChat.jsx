import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Send, Loader2, ArrowLeft, FileText } from "lucide-react";
import API from "../api/axios";

function StudentChat() {
  const navigate = useNavigate();
  const location = useLocation();

  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(
    location.state?.selectedDocumentId || ""
  );
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [sourceDocumentTitle, setSourceDocumentTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchDocuments = async () => {
    try {
      const res = await API.get("/documents/");
      setDocuments(res.data.documents || []);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load uploaded study materials.");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleAsk = async () => {
    if (!selectedDocumentId) {
      setMessage("Please select a study material PDF first.");
      return;
    }

    if (!question.trim()) {
      setMessage("Please enter your question.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setAnswer("");
      setSources([]);
      setSourceDocumentTitle("");

      const res = await API.post("/chat/ask", {
        question: question,
        document_id: selectedDocumentId,
      });

      setAnswer(res.data.answer);
      setSources(res.data.sources || []);
      setSourceDocumentTitle(res.data.source_document_title || "");
    } catch (error) {
      console.error(error);
      setAnswer("");
      setSources([]);
      setMessage(error.response?.data?.detail || "Failed to get answer.");
    } finally {
      setLoading(false);
    }
  };

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
            AI Chat Assistant
          </h1>
          <p className="text-slate-500">
            Ask questions from a selected uploaded study material.
          </p>
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-indigo-100 text-indigo-600 p-3 rounded-xl">
              <FileText />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Select Study Material
              </h2>
              <p className="text-slate-500">
                Choose the PDF you want to ask questions from.
              </p>
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Study Material PDF
          </label>

          <select
            value={selectedDocumentId}
            onChange={(e) => {
              setSelectedDocumentId(e.target.value);
              setMessage("");
              setAnswer("");
              setSources([]);
              setSourceDocumentTitle("");
            }}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select an uploaded document</option>

            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.title}
              </option>
            ))}
          </select>

          {documents.length === 0 && (
            <p className="mt-2 text-sm text-red-500">
              No uploaded study materials found. Please ask your teacher to
              upload a PDF.
            </p>
          )}

          <label className="block text-sm font-medium text-slate-700 mb-2 mt-5">
            Your Question
          </label>

          <textarea
            value={question}
            onChange={(e) => {
              setQuestion(e.target.value);
              setMessage("");
            }}
            rows="4"
            placeholder="Example: What is machine learning?"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            onClick={handleAsk}
            disabled={loading || documents.length === 0}
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

          {message && (
            <div className="mt-5 bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-xl">
              {message}
            </div>
          )}
        </div>

        {answer && (
          <div className="bg-white rounded-2xl shadow p-6 mt-6">
            <h2 className="text-xl font-bold text-slate-800 mb-3">
              AI Answer
            </h2>

            {sourceDocumentTitle && (
              <p className="text-sm text-slate-500 mb-4">
                Source Document: {sourceDocumentTitle}
              </p>
            )}

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
                  <p className="font-medium text-slate-800">{source.title}</p>

                  <p className="text-sm text-slate-500 mt-1">
                    Chunk {source.chunk_index} | Score:{" "}
                    {Number(source.score).toFixed(3)}
                  </p>

                  <p className="text-slate-600 text-sm mt-3">
                    {source.text?.slice(0, 450)}...
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