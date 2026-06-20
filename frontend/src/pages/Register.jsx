import { useState } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../api";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const register = async (e) => {
    e.preventDefault();

    try {
      await registerUser({ username, password });

      alert("Registration Successful");
      window.location.href = "/";
    } catch (err) {
      console.error("Register error:", err);
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
          <p>Create access for your hospital team</p>
        </div>

        <h2>Create an account</h2>

        <form onSubmit={register}>
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

          <button type="submit">Register</button>
        </form>

        <p className="alt-action">
          Already have an account?
          <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
