import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { loginAdmin } from "../api";
import { setAuthSession } from "../auth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    const session = await loginAdmin({ username, password });
    setAuthSession(session);
    navigate("/dashboard");
  };

  return (
    <AuthForm
      title="Admin Login"
      subtitle="Access hospital management, staff, and appointment controls."
      submitLabel="Sign In"
      onSubmit={submit}
      footer={
        <p className="alt-action">
          Back to <Link to="/">Login options</Link>
        </p>
      }
    >
      <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
    </AuthForm>
  );
}