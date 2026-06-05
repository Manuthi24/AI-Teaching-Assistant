import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherGenerateQuiz from "./pages/TeacherGenerateQuiz";

import StudentDashboard from "./pages/StudentDashboard";
import StudentChat from "./pages/StudentChat";
import StudentQuizzes from "./pages/StudentQuizzes";
import StudentAttemptQuiz from "./pages/StudentAttemptQuiz";
import StudentQuizResult from "./pages/StudentQuizResult";

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRole && user.role !== allowedRole) {
    if (user.role === "teacher") {
      return <Navigate to="/teacher/dashboard" replace />;
    }

    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/generate-quiz"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherGenerateQuiz />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/chat"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentChat />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/quizzes"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentQuizzes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/quiz/:quizId"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentAttemptQuiz />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/quiz-result"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentQuizResult />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;