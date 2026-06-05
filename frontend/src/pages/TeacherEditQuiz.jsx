import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";
import API from "../api/axios";

function TeacherEditQuiz() {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const messageRef = useRef(null);

  const [quiz, setQuiz] = useState(null);
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  useEffect(() => {
    if (message && messageRef.current) {
      messageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [message]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);

      const res = await API.get(`/quiz/${quizId}`);
      const quizData = res.data.quiz;

      setQuiz(quizData);
      setTitle(quizData.title || "");
      setTopic(quizData.topic || "");
      setQuestions(quizData.questions || []);
    } catch (error) {
      console.error(error);
      setMessageType("error");
      setMessage(error.response?.data?.detail || "Failed to load quiz.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const updateQuestionField = (questionIndex, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      [field]: value,
    };

    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    const updatedOptions = [...updatedQuestions[questionIndex].options];

    updatedOptions[optionIndex] = value;

    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: updatedOptions,
    };

    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex) => {
    const updatedQuestions = [...questions];

    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      options: [...updatedQuestions[questionIndex].options, ""],
    };

    setQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex, optionIndex) => {
    const updatedQuestions = [...questions];
    const currentQuestion = updatedQuestions[questionIndex];

    if (currentQuestion.options.length <= 2) {
      setMessageType("error");
      setMessage("Each question must have at least 2 options.");
      return;
    }

    const updatedOptions = currentQuestion.options.filter(
      (_, index) => index !== optionIndex
    );

    let correctIndex = currentQuestion.correct_option_index;

    if (correctIndex === optionIndex) {
      correctIndex = 0;
    } else if (correctIndex > optionIndex) {
      correctIndex -= 1;
    }

    updatedQuestions[questionIndex] = {
      ...currentQuestion,
      options: updatedOptions,
      correct_option_index: correctIndex,
    };

    setQuestions(updatedQuestions);
  };

  const addQuestion = () => {
    const newQuestionNumber = questions.length + 1;

    setQuestions([
      ...questions,
      {
        id: `q${newQuestionNumber}`,
        question: "",
        options: ["", ""],
        correct_option_index: 0,
        explanation: "",
      },
    ]);
  };

  const removeQuestion = (questionIndex) => {
    if (questions.length <= 1) {
      setMessageType("error");
      setMessage("Quiz must have at least 1 question.");
      return;
    }

    const updatedQuestions = questions.filter(
      (_, index) => index !== questionIndex
    );

    setQuestions(updatedQuestions);
  };

  const validateQuiz = () => {
    if (!title.trim()) {
      return "Quiz title is required.";
    }

    if (!topic.trim()) {
      return "Quiz topic is required.";
    }

    if (questions.length === 0) {
      return "Quiz must have at least one question.";
    }

    for (const question of questions) {
      if (!question.question.trim()) {
        return `Question ${question.id} text is required.`;
      }

      if (!question.options || question.options.length < 2) {
        return `Question ${question.id} must have at least 2 options.`;
      }

      for (const option of question.options) {
        if (!option.trim()) {
          return `Question ${question.id} has an empty option.`;
        }
      }

      if (
        question.correct_option_index < 0 ||
        question.correct_option_index >= question.options.length
      ) {
        return `Question ${question.id} has invalid correct answer.`;
      }
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateQuiz();

    if (validationError) {
      setMessageType("error");
      setMessage(validationError);
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const payload = {
        title: title.trim(),
        topic: topic.trim(),
        questions: questions.map((question, index) => ({
          id: question.id || `q${index + 1}`,
          question: question.question.trim(),
          options: question.options.map((option) => option.trim()),
          correct_option_index: Number(question.correct_option_index),
          explanation: question.explanation?.trim() || "",
        })),
      };

      const res = await API.put(`/quiz/${quizId}`, payload);

      setQuiz(res.data.quiz);
      setMessageType("success");
      setMessage(res.data.message || "Quiz updated successfully.");
    } catch (error) {
      console.error(error);
      setMessageType("error");
      setMessage(error.response?.data?.detail || "Failed to update quiz.");
    } finally {
      setSaving(false);
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

  if (!quiz && message) {
    return (
      <div className="min-h-screen bg-slate-100 p-8">
        <div className="bg-red-50 text-red-600 rounded-2xl p-5">
          {message}
        </div>

        <button
          onClick={() => navigate("/teacher/quizzes")}
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
          onClick={() => navigate("/teacher/quizzes")}
          className="text-slate-600 hover:text-indigo-600"
        >
          <ArrowLeft />
        </button>

        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Edit Quiz
          </h1>
          <p className="text-slate-500">
            Update AI-generated quiz content before students attempt it.
          </p>
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto">
        {message && (
          <div
            ref={messageRef}
            className={`mb-6 px-4 py-3 rounded-xl border flex items-center gap-2 ${
              messageType === "success"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-600 border-red-200"
            }`}
          >
            <AlertCircle size={18} />
            {message}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-800 mb-5">
            Quiz Details
          </h2>

          <label className="block text-sm font-medium text-slate-700 mb-2">
            Quiz Title
          </label>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <label className="block text-sm font-medium text-slate-700 mb-2 mt-5">
            Topic
          </label>

          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-6">
          {questions.map((question, questionIndex) => (
            <div
              key={question.id || questionIndex}
              className="bg-white rounded-2xl shadow p-6"
            >
              <div className="flex items-center justify-between gap-4 mb-5">
                <h2 className="text-xl font-bold text-slate-800">
                  Question {questionIndex + 1}
                </h2>

                <button
                  onClick={() => removeQuestion(questionIndex)}
                  className="bg-red-50 text-red-600 px-3 py-2 rounded-xl hover:bg-red-100 inline-flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Remove Question
                </button>
              </div>

              <label className="block text-sm font-medium text-slate-700 mb-2">
                Question Text
              </label>

              <textarea
                value={question.question}
                onChange={(e) =>
                  updateQuestionField(
                    questionIndex,
                    "question",
                    e.target.value
                  )
                }
                rows="3"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="mt-5">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Options
                </label>

                <div className="space-y-3">
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`correct-${questionIndex}`}
                        checked={
                          Number(question.correct_option_index) === optionIndex
                        }
                        onChange={() =>
                          updateQuestionField(
                            questionIndex,
                            "correct_option_index",
                            optionIndex
                          )
                        }
                      />

                      <input
                        type="text"
                        value={option}
                        onChange={(e) =>
                          updateOption(
                            questionIndex,
                            optionIndex,
                            e.target.value
                          )
                        }
                        placeholder={`Option ${optionIndex + 1}`}
                        className="flex-1 border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
                      />

                      <button
                        onClick={() => removeOption(questionIndex, optionIndex)}
                        className="bg-red-50 text-red-600 px-3 py-3 rounded-xl hover:bg-red-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => addOption(questionIndex)}
                  className="mt-3 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-200 inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Option
                </button>

                <p className="text-sm text-slate-500 mt-2">
                  Select the radio button beside the correct answer.
                </p>
              </div>

              <label className="block text-sm font-medium text-slate-700 mb-2 mt-5">
                Explanation
              </label>

              <textarea
                value={question.explanation}
                onChange={(e) =>
                  updateQuestionField(
                    questionIndex,
                    "explanation",
                    e.target.value
                  )
                }
                rows="3"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={addQuestion}
            className="bg-slate-800 text-white px-6 py-3 rounded-xl hover:bg-slate-900 inline-flex items-center gap-2"
          >
            <Plus size={18} />
            Add Question
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 disabled:bg-green-300 inline-flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Quiz
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TeacherEditQuiz;