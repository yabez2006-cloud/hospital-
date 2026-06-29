import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  fetchPatients,
  fetchDoctors,
  fetchAppointments,
  deleteAppointment,
  approveAppointment,
  rejectAppointment
} from "../api";
import ConsultationForm from "../components/ConsultationForm";
import { getAuthUser } from "../auth";
import { FaClock, FaCheckCircle, FaTimesCircle, FaCheck, FaTimes, FaStethoscope } from "react-icons/fa";

export default function Appointments() {
  const user = getAuthUser();
  const role = user?.role || "admin";
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'today', 'pending'
  const [activeConsultation, setActiveConsultation] = useState(null); // appointment being consulted

  const loadData = async () => {
    try {
      const data = await fetchAppointments();
      setAppointments(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this appointment?")) {
      try {
        await deleteAppointment(id);
        loadData();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveAppointment(id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectAppointment(id);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!["admin", "doctor", "patient"].includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Filter logic for Doctor
  const todayStr = new Date().toDateString();
  const filteredAppointments = appointments.filter((app) => {
    if (role !== "doctor") return true;

    const appDateStr = new Date(app.date).toDateString();
    if (activeTab === "today") {
      return appDateStr === todayStr && (app.status === "Approved" || app.status === "Completed");
    } else if (activeTab === "pending") {
      return app.status === "Pending";
    }
    return true; // 'all'
  });

  return (
    <section>
      <h2>{role === "admin" ? "All Hospital Appointments" : role === "doctor" ? "Doctor Appointments" : "My Appointments"}</h2>
      {error && <div className="error">{error}</div>}

      {/* Patient info/link */}
      {role === "patient" && (
        <div style={{ marginBottom: 20 }}>
          <p>
            To request a new appointment with a doctor, please visit the{" "}
            <Link to="/doctors" style={{ fontWeight: "bold", textDecoration: "underline" }}>
              View Doctors
            </Link>{" "}
            page and select an available time slot.
          </p>
        </div>
      )}

      {/* Tabs for Doctor */}
      {role === "doctor" && (
        <div className="auth-tabs" style={{ marginBottom: 20 }}>
          <button
            type="button"
            className={`auth-tab ${activeTab === "all" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("all");
              setActiveConsultation(null);
            }}
          >
            All Appointments
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === "today" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("today");
              setActiveConsultation(null);
            }}
          >
            Today's Appointments
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("pending");
              setActiveConsultation(null);
            }}
          >
            Appointment Requests
          </button>
        </div>
      )}

      {filteredAppointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        <ul style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {filteredAppointments.map((appointment) => {
            const isPending = appointment.status === "Pending";
            const isApproved = appointment.status === "Approved";
            const isRejected = appointment.status === "Rejected";
            const isCompleted = appointment.status === "Completed";

            return (
              <li
                key={appointment._id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "16px",
                  borderLeft: isPending
                    ? "6px solid #e2e8f0"
                    : isApproved
                    ? "6px solid #0d6efd"
                    : isCompleted
                    ? "6px solid #20c997"
                    : "6px solid #dc3545",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: "1.1em", fontWeight: 600 }}>
                      {role === "patient" ? (
                        <>Appointment with Doctor: {appointment.doctor?.name || "Doctor"}</>
                      ) : (
                        <>Patient: {appointment.patient?.name || appointment.patientName || "Patient"}</>
                      )}
                    </span>
                    <div style={{ color: "#666", fontSize: "0.9em", marginTop: 4 }}>
                      <FaClock style={{ marginRight: 6, verticalAlign: "middle" }} />
                      {new Date(appointment.date).toLocaleDateString()} at {appointment.time || "N/A"}
                    </div>
                    {appointment.notes && (
                      <div style={{ fontStyle: "italic", fontSize: "0.85em", color: "#888", marginTop: 4 }}>
                        Notes: {appointment.notes}
                      </div>
                    )}
                    <div style={{ marginTop: 8 }}>
                      Status:{" "}
                      <strong
                        style={{
                          color: isPending
                            ? "#64748b"
                            : isApproved
                            ? "var(--primary)"
                            : isCompleted
                            ? "var(--secondary)"
                            : "var(--danger)",
                        }}
                      >
                        {appointment.status}
                      </strong>
                    </div>

                    {/* Specification requirement: If rejected show please select another slot */}
                    {role === "patient" && isRejected && (
                      <p style={{ color: "var(--danger)", fontSize: "0.85em", margin: "4px 0 0 0" }}>
                        Please select another available slot.
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    {role === "admin" && (
                      <button className="btn-delete" onClick={() => handleDelete(appointment._id)}>
                        Delete
                      </button>
                    )}

                    {role === "doctor" && isPending && (
                      <>
                        <button
                          className="btn-primary"
                          onClick={() => handleApprove(appointment._id)}
                          style={{ display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <FaCheck /> Approve
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleReject(appointment._id)}
                          style={{ display: "flex", alignItems: "center", gap: 4 }}
                        >
                          <FaTimes /> Reject
                        </button>
                      </>
                    )}

                    {role === "doctor" && isApproved && (
                      <button
                        className="btn-secondary"
                        onClick={() => setActiveConsultation(appointment)}
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <FaStethoscope /> Consult
                      </button>
                    )}
                  </div>
                </div>

                {/* Consultation form inline */}
                {role === "doctor" && activeConsultation?._id === appointment._id && (
                  <ConsultationForm
                    appointment={appointment}
                    onCompleted={() => {
                      setActiveConsultation(null);
                      loadData();
                    }}
                    onCancel={() => setActiveConsultation(null)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
