import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api";
import AuthForm from "../components/AuthForm";
import { setAuthSession } from "../auth";

function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const register = async (e) => {
    e.preventDefault();

    try {
      const session = await registerUser({ username, password });
      setAuthSession(session);
      navigate("/dashboard");
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
    <AuthForm
      title="Patient Register"
      subtitle="Create a patient account to use the portal."
      submitLabel="Register"
      onSubmit={register}
      footer={
        <p className="alt-action">
          Already have an account? <Link to="/patient-login">Patient Login</Link>
        </p>
      }
    >
      <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
    </AuthForm>
  );
}

export default Register;
