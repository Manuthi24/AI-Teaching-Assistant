import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, ArrowLeft, Trophy } from "lucide-react";

function StudentQuizResult() {
  const navigate = useNavigate();
  const location = useLocation();

  const storedResult = localStorage.getItem("latestQuizResult");
  const data = location.state || (storedResult ? JSON.parse(storedResult) : null);

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  if (!data || !data.result) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-800">
            No result found
          </h1>
          <p className="text-slate-500 mt-2">
            Please attempt a quiz first.
          </p>

          <button
            onClick={() => navigate("/student/quizzes")}
            className="mt-5 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  const { result, quiz } = data;

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
          <h1 className="text-2xl font-bold text-slate-800">
            Quiz Result
          </h1>
          <p className="text-slate-500">
            {quiz?.title || "Review your quiz answers"}
          </p>
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full mx-auto flex items-center justify-center mb-4">
            <Trophy size={40} />
          </div>

          <h2 className="text-5xl font-bold text-slate-800">
            {result.percentage}%
          </h2>

          <p className="text-slate-500 mt-3">
            You scored {result.score} out of {result.total}
          </p>

          <div className="mt-5">
            {result.percentage >= 75 ? (
              <span className="bg-green-50 text-green-700 px-4 py-2 rounded-full">
                Excellent Work
              </span>
            ) : result.percentage >= 50 ? (
              <span className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-full">
                Good Attempt
              </span>
            ) : (
              <span className="bg-red-50 text-red-700 px-4 py-2 rounded-full">
                Keep Practicing
              </span>
            )}
          </div>

          <button
            onClick={() => {
              document.getElementById("answer-review")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
            className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
          >
            View Answer Review
          </button>
        </div>

        <div id="answer-review" className="mt-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-5">
            Answer Review
          </h2>

          <div className="space-y-5">
            {result.review.map((item, index) => (
              <div
                key={item.question_id}
                className="bg-white rounded-2xl shadow p-6"
              >
                <div className="flex items-start gap-3">
                  {item.is_correct ? (
                    <CheckCircle className="text-green-600 mt-1" />
                  ) : (
                    <XCircle className="text-red-600 mt-1" />
                  )}

                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">
                      {index + 1}. {item.question}
                    </h3>

                    <div className="mt-4 space-y-2">
                      {item.options.map((option, optionIndex) => {
                        const isStudentAnswer =
                          optionIndex === item.student_answer;
                        const isCorrectAnswer =
                          optionIndex === item.correct_answer;

                        return (
                          <div
                            key={optionIndex}
                            className={`px-4 py-2 rounded-lg border ${
                              isCorrectAnswer
                                ? "bg-green-50 border-green-300 text-green-700"
                                : isStudentAnswer
                                ? "bg-red-50 border-red-300 text-red-700"
                                : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            {optionIndex + 1}. {option}

                            {isCorrectAnswer && (
                              <span className="ml-2 font-medium">
                                Correct Answer
                              </span>
                            )}

                            {isStudentAnswer && !isCorrectAnswer && (
                              <span className="ml-2 font-medium">
                                Your Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <p className="mt-4 text-sm text-slate-600">
                      <span className="font-medium">Explanation:</span>{" "}
                      {item.explanation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate("/student/quizzes")}
          className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700"
        >
          Back to Quizzes
        </button>
      </div>
    </div>
  );
}

export default StudentQuizResult;