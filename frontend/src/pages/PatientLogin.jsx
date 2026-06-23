import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { loginPatient } from "../api";
import { setAuthSession } from "../auth";

export default function PatientLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    const session = await loginPatient({ username, password });
    setAuthSession(session);
    navigate("/dashboard");
  };

  return (
    <AuthForm
      title="Patient Login"
      subtitle="Check doctors, favorites, feedback, and your dashboard."
      submitLabel="Sign In"
      onSubmit={submit}
      footer={
        <p className="alt-action">
          New patient? <Link to="/register">Register</Link>
        </p>
      }
    >
      <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
    </AuthForm>
  );
}