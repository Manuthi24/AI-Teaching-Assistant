import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, ClipboardList } from "lucide-react";
import API from "../api/axios";

function TeacherGenerateQuiz() {
  const navigate = useNavigate();
  const location = useLocation();

  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(
    location.state?.selectedDocumentId || ""
  );
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchDocuments = async () => {
    try {
      const res = await API.get("/documents/");
      setDocuments(res.data.documents || []);
    } catch (error) {
      console.error(error);
      setMessage("Failed to load uploaded documents.");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) {
      setMessage("Please enter a quiz topic.");
      return;
    }

    if (!selectedDocumentId) {
      setMessage("Please select a study material PDF before generating quiz.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setQuiz(null);

      const res = await API.post("/quiz/generate", {
        topic: topic,
        num_questions: Number(numQuestions),
        document_id: selectedDocumentId,
      });

      setQuiz(res.data.quiz);
      setMessage(res.data.message);
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.detail || "Quiz generation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b px-8 py-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/teacher/dashboard")}
          className="text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Generate AI Quiz
          </h1>
          <p className="text-slate-500">
            Create quizzes from a selected uploaded study material.
          </p>
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-purple-100 text-purple-600 p-3 rounded-xl">
              <ClipboardList />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Quiz Details
              </h2>
              <p className="text-slate-500">
                Select a PDF and enter a topic from that document.
              </p>
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Study Material PDF
          </label>

          <select
            value={selectedDocumentId}
            onChange={(e) => {
              setSelectedDocumentId(e.target.value);
              setMessage("");
              setQuiz(null);
            }}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
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
              No uploaded documents found. Please upload a PDF first.
            </p>
          )}

          <label className="block text-sm font-medium text-slate-700 mb-2 mt-5">
            Topic
          </label>

          <input
            type="text"
            value={topic}
            onChange={(e) => {
              setTopic(e.target.value);
              setMessage("");
            }}
            placeholder="Example: machine learning"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
          />

          <label className="block text-sm font-medium text-slate-700 mb-2 mt-5">
            Number of Questions
          </label>

          <select
            value={numQuestions}
            onChange={(e) => setNumQuestions(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="3">3 Questions</option>
            <option value="5">5 Questions</option>
            <option value="10">10 Questions</option>
          </select>

          <button
            onClick={handleGenerateQuiz}
            disabled={loading || documents.length === 0}
            className="mt-6 bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 disabled:bg-purple-300 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Generating Quiz...
              </>
            ) : (
              "Generate Quiz"
            )}
          </button>

          {message && (
            <div className="mt-5 bg-slate-100 text-slate-700 px-4 py-3 rounded-xl">
              {message}
            </div>
          )}
        </div>

        {quiz && (
          <div className="bg-white rounded-2xl shadow p-6 mt-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">
              {quiz.title}
            </h2>

            <p className="text-slate-500 mb-2">
              Topic: {quiz.topic} | Questions: {quiz.questions.length}
            </p>

            <p className="text-slate-500 mb-5">
              Source Document: {quiz.source_document_title}
            </p>

            <div className="space-y-5">
              {quiz.questions.map((question, index) => (
                <div
                  key={question.id}
                  className="border border-slate-200 rounded-xl p-5"
                >
                  <h3 className="font-bold text-slate-800 mb-3">
                    {index + 1}. {question.question}
                  </h3>

                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={`px-4 py-2 rounded-lg border ${
                          optionIndex === question.correct_option_index
                            ? "bg-green-50 border-green-300 text-green-700"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        {optionIndex + 1}. {option}
                      </div>
                    ))}
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    <span className="font-medium">Explanation:</span>{" "}
                    {question.explanation}
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

export default TeacherGenerateQuiz;