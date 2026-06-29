import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { loginAdmin } from "../api";
import { setAuthSession } from "../auth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await loginAdmin({ username, password });
      setAuthSession(session);
      navigate("/dashboard");
    } catch (err) {
      console.error("Admin login error:", err);
      setError(err.message || "Network error: unable to reach the backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title="Admin Login"
      subtitle="Access hospital management, staff, and appointment controls."
      submitLabel={loading ? "Signing In..." : "Sign In"}
      onSubmit={submit}
      footer={
        <p className="alt-action">
          Back to <Link to="/">Login options</Link>
        </p>
      }
    >
      {error && <div className="error-message">{error}</div>}
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
    </AuthForm>
  );
}