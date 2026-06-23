import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthForm from "../components/AuthForm";
import { loginDoctor } from "../api";
import { setAuthSession } from "../auth";

export default function DoctorLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    const session = await loginDoctor({ username, password });
    setAuthSession(session);
    navigate("/dashboard");
  };

  return (
    <AuthForm
      title="Doctor Login"
      subtitle="Review your profile, availability, and appointments."
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