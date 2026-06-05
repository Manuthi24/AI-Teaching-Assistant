import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import API from "../api/axios";

function StudentAttemptQuiz() {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const errorRef = useRef(null);

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (message && errorRef.current) {
      errorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [message]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/quiz/${quizId}`);
      setQuiz(res.data.quiz);
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.detail || "Failed to load quiz.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const handleAnswerChange = (questionId, optionIndex) => {
    setAnswers({
      ...answers,
      [questionId]: optionIndex,
    });

    setMessage("");
  };

  const handleSubmit = async () => {
    if (!quiz) return;

    if (Object.keys(answers).length !== quiz.questions.length) {
      setMessage("Please answer all questions before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");

      const res = await API.post("/quiz/submit", {
        quiz_id: quiz.id,
        answers: answers,
      });

      const resultData = {
        result: res.data,
        quiz: quiz,
      };

      localStorage.setItem("latestQuizResult", JSON.stringify(resultData));

      navigate("/student/quiz-result", {
        state: resultData,
      });
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.detail || "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow p-8 flex items-center gap-3">
          <Loader2 className="animate-spin text-indigo-600" />
          <p className="text-slate-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (message && !quiz) {
    return (
      <div className="min-h-screen bg-slate-100 p-8">
        <div
          ref={errorRef}
          className="bg-red-50 text-red-600 rounded-2xl p-5"
        >
          {message}
        </div>

        <button
          onClick={() => navigate("/student/quizzes")}
          className="mt-5 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="bg-white border-b px-8 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button
          onClick={() => navigate("/student/quizzes")}
          className="text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-800">{quiz?.title}</h1>
          <p className="text-slate-500">Topic: {quiz?.topic}</p>
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto">
        {message && (
          <div
            ref={errorRef}
            className="mb-5 bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-200"
          >
            {message}
          </div>
        )}

        <div className="space-y-6">
          {quiz?.questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-2xl shadow p-6">
              <h2 className="font-bold text-slate-800 mb-4">
                {index + 1}. {question.question}
              </h2>

              <div className="space-y-3">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={optionIndex}
                    className={`block px-4 py-3 rounded-xl border cursor-pointer ${
                      answers[question.id] === optionIndex
                        ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={answers[question.id] === optionIndex}
                      onChange={() =>
                        handleAnswerChange(question.id, optionIndex)
                      }
                      className="mr-3"
                    />

                    {option}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-6 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 disabled:bg-green-300 flex items-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Submitting...
            </>
          ) : (
            "Submit Quiz"
          )}
        </button>
      </div>
    </div>
  );
}

export default StudentAttemptQuiz;