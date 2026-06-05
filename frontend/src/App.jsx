import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherGenerateQuiz from "./pages/TeacherGenerateQuiz";
import TeacherReports from "./pages/TeacherReports";
import TeacherQuizzes from "./pages/TeacherQuizzes";
import TeacherEditQuiz from "./pages/TeacherEditQuiz";

import StudentDashboard from "./pages/StudentDashboard";
import StudentChat from "./pages/StudentChat";
import StudentQuizzes from "./pages/StudentQuizzes";
import StudentAttemptQuiz from "./pages/StudentAttemptQuiz";
import StudentQuizResult from "./pages/StudentQuizResult";
import StudentHistory from "./pages/StudentHistory";

import StudyMaterials from "./pages/StudyMaterials";

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
          path="/teacher/quizzes"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherQuizzes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/quiz/edit/:quizId"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherEditQuiz />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/reports"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherReports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/teacher/materials"
          element={
            <ProtectedRoute allowedRole="teacher">
              <StudyMaterials />
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

        <Route
          path="/student/history"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentHistory />
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/materials"
          element={
            <ProtectedRoute allowedRole="student">
              <StudyMaterials />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;