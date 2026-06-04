import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function Login() {
  const [role, setRole] = useState("student");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await API.post("/auth/google-login", {
        credential: credentialResponse.credential,
        role: role,
      });

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "teacher") {
        navigate("/teacher/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    } catch (error) {
      console.error(error);
      setMessage("Google login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-cyan-100 flex items-center justify-center px-4">
      <div className="bg-white/90 backdrop-blur p-10 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl font-bold">
            AI
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mt-5">
            AI Teaching Assistant
          </h1>

          <p className="text-slate-500 mt-3">
            Sign in with Google to continue your learning journey.
          </p>
        </div>

        <div className="mt-8">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select your role
          </label>

          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        <div className="mt-7 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setMessage("Google login failed.")}
          />
        </div>

        {message && (
          <div className="mt-5 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-center">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;