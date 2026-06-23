import { Link } from "react-router-dom";

function Login() {
  return (
    <div className="login-page">
      <div className="login-card login-landing-card">
        <div className="logo-section">
          <h1>🏥 Hospital Management System</h1>
          <p>Select the correct portal to continue</p>
        </div>

        <div className="login-landing-grid">
          <Link className="portal-card" to="/admin-login">
            <span>Admin Login</span>
          </Link>
          <Link className="portal-card" to="/doctor-login">
            <span>Doctor Login</span>
          </Link>
          <Link className="portal-card" to="/patient-login">
            <span>Patient Login</span>
          </Link>
          <Link className="portal-card portal-register" to="/register">
            <span>Patient Register</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
