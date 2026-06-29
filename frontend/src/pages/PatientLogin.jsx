import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { loginPatient, registerUser } from "../api";
import { setAuthSession } from "../auth";

export default function PatientLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";

  const [isRegister, setIsRegister] = useState(initialMode === "register");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsRegister(searchParams.get("mode") === "register");
    setError("");
  }, [searchParams]);

  const handleToggle = (toRegister) => {
    setIsRegister(toRegister);
    setError("");
    navigate(toRegister ? "/patient-login?mode=register" : "/patient-login", { replace: true });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      let session;
      if (isRegister) {
        session = await registerUser({ username, password, name });
      } else {
        session = await loginPatient({ username, password });
      }
      setAuthSession(session);
      navigate("/dashboard");
    } catch (err) {
      console.error(isRegister ? "Register error:" : "Login error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Network error: unable to reach the backend"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      title={isRegister ? "Patient Register" : "Patient Login"}
      subtitle={
        isRegister
          ? "Create a patient account to use the portal."
          : "Check doctors, favorites, feedback, and your dashboard."
      }
      submitLabel={loading ? (isRegister ? "Registering..." : "Signing In...") : (isRegister ? "Register" : "Sign In")}
      onSubmit={submit}
      footer={
        <p className="alt-action">
          {isRegister ? "Already have an account? " : "New patient? "}
          <button
            type="button"
            className="toggle-mode-btn"
            onClick={() => handleToggle(!isRegister)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: "var(--primary)",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "inherit"
            }}
          >
            {isRegister ? "Patient Login" : "Register"}
          </button>
        </p>
      }
    >
      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab ${!isRegister ? "active" : ""}`}
          onClick={() => handleToggle(false)}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`auth-tab ${isRegister ? "active" : ""}`}
          onClick={() => handleToggle(true)}
        >
          Register
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      {isRegister && (
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      )}
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