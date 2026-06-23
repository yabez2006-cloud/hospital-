export default function AuthForm({ title, subtitle, submitLabel, onSubmit, footer, children }) {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-section">
          <h1>🏥 Hospital Management System</h1>
          <p>Manage Patients, Doctors & Appointments</p>
        </div>

        <h2>{title}</h2>
        {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}

        <form onSubmit={onSubmit}>
          {children}
          <button type="submit">{submitLabel}</button>
        </form>

        {footer}
      </div>
    </div>
  );
}