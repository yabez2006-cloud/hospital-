import { useState } from "react";
import { Link } from "react-router-dom";
import { loginUser } from "../api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = async (e) => {
    e.preventDefault();

    try {
      const res = await loginUser({ username, password });

      alert(res.message);
      window.location.href = "/home";
    } catch (err) {
      console.error("Login error:", err);
      alert(
        err.response?.data?.message ||
          err.message ||
          "Network error: unable to reach the backend"
      );
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-section">
          <h1>🏥 Hospital Management System</h1>
          <p>Manage Patients, Doctors & Appointments</p>
        </div>

        <h2>Login to your account</h2>

        <form onSubmit={login}>
          <input
            type="text"
            placeholder="User ID"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Login</button>
        </form>

        <p className="alt-action">
          Don't have an account?
          <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
