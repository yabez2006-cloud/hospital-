import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  fetchDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  fetchMyPatientProfile,
  updateFavoriteDoctor as saveFavoriteDoctor,
  fetchDoctorAvailability,
  bookAppointment
} from "../api";
import DoctorForm from "../components/DoctorForm";
import { getAuthUser } from "../auth";
import { FaHeart, FaRegHeart, FaCalendarAlt, FaStethoscope } from "react-icons/fa";

export default function Doctors() {
  const user = getAuthUser();
  const role = user?.role || "admin";
  const [doctors, setDoctors] = useState([]);
  const [favoriteDoctor, setFavoriteDoctor] = useState(null);
  const [error, setError] = useState("");

  // Admin edit mode state
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", specialization: "", availability: "Available" });

  // Patient booking state
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [allSlots, setAllSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    try {
      const doctorData = await fetchDoctors();
      setDoctors(doctorData);

      if (role === "patient") {
        const patientProfile = await fetchMyPatientProfile();
        setFavoriteDoctor(patientProfile.favoriteDoctor || null);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  // Load slots for the selected doctor when booking
  useEffect(() => {
    if (!bookingDoctor) {
      setAllSlots([]);
      setAvailableSlots([]);
      return;
    }
    fetchDoctorAvailability(bookingDoctor._id)
      .then((slots) => {
        setAllSlots(slots || []);
      })
      .catch(() => {
        setAllSlots([]);
      });
  }, [bookingDoctor]);

  // Filter slots when a date is selected
  useEffect(() => {
    if (!selectedDate || allSlots.length === 0) {
      setAvailableSlots([]);
      return;
    }
    const d = new Date(selectedDate);
    const filtered = allSlots.filter(
      (slot) =>
        new Date(slot.availableDate).toDateString() === d.toDateString() &&
        slot.status === "Available"
    );
    setAvailableSlots(filtered);
    setSelectedSlot(null);
  }, [selectedDate, allSlots]);

  // Admin CRUD handlers
  const handleCreate = async (data) => {
    try {
      await createDoctor(data);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (doctor) => {
    setEditingDoctor(doctor);
    setEditForm({
      name: doctor.name || "",
      specialization: doctor.specialization || "",
      availability: doctor.availability || "Available",
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await updateDoctor(editingDoctor._id, editForm);
      setEditingDoctor(null);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this doctor?")) {
      await deleteDoctor(id);
      loadData();
    }
  };

  // Patient handlers
  const handleFavoriteToggle = async (doctor) => {
    try {
      const isFav = favoriteDoctor?._id === doctor._id;
      const targetDoctorId = isFav ? null : doctor._id;
      const updatedProfile = await saveFavoriteDoctor(targetDoctorId);
      setFavoriteDoctor(updatedProfile.favoriteDoctor || null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return alert("Please select a time slot");
    try {
      await bookAppointment({
        doctor: bookingDoctor._id,
        availableDate: selectedDate,
        startTime: selectedSlot.startTime,
        notes: notes,
      });
      alert("Appointment requested successfully! Pending doctor approval.");
      // reset states
      setBookingDoctor(null);
      setSelectedDate("");
      setSelectedSlot(null);
      setNotes("");
      loadData();
    } catch (err) {
      alert(err.message || "Failed to request appointment");
    }
  };

  if (role === "doctor") {
    return <Navigate to="/doctor-profile" replace />;
  }

  return (
    <div className="doctors-container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
      {/* List Panel */}
      <section style={{ gridColumn: role === "admin" || bookingDoctor ? "span 1" : "span 2" }}>
        <h2>{role === "admin" ? "Doctor Management" : "Available Doctors"}</h2>
        {error && <div className="error">{error}</div>}
        <ul className="doctors-list" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {doctors.map((doctor) => {
            const isFavorite = favoriteDoctor?._id === doctor._id;
            return (
              <li
                key={doctor._id}
                className="card"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px",
                  border: isFavorite ? "1.5px solid #0d6efd" : "1px solid #e5e7eb",
                }}
              >
                <div>
                  <h3 style={{ margin: "0 0 6px 0", color: "var(--dark)" }}>
                    <FaStethoscope style={{ marginRight: 8, color: "var(--primary)" }} />
                    {doctor.name}
                  </h3>
                  <p style={{ margin: "0 0 4px 0", color: "#666" }}>
                    Specialization: <strong>{doctor.specialization}</strong>
                  </p>
                  <p style={{ margin: 0, fontSize: "0.85em" }}>
                    Status:{" "}
                    <span
                      style={{
                        color: doctor.availability === "Unavailable" ? "var(--danger)" : "var(--secondary)",
                        fontWeight: "bold",
                      }}
                    >
                      {doctor.availability || "Available"}
                    </span>
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {role === "admin" ? (
                    <>
                      <button className="btn-secondary" onClick={() => startEdit(doctor)}>
                        Edit
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(doctor._id)}>
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleFavoriteToggle(doctor)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: isFavorite ? "var(--danger)" : "#94a3b8",
                          fontSize: "1.35rem",
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                        title={isFavorite ? "Unfavorite Doctor" : "Favorite Doctor"}
                      >
                        {isFavorite ? <FaHeart /> : <FaRegHeart />}
                      </button>
                      <button
                        className="btn-primary"
                        onClick={() => setBookingDoctor(doctor)}
                        disabled={doctor.availability === "Unavailable"}
                      >
                        View Profile & Book
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Action / Detail Panel */}
      {role === "admin" && (
        <section>
          {editingDoctor ? (
            <form onSubmit={handleUpdate} className="card" style={{ display: "flex", flexDirection: "column" }}>
              <h2>Edit Doctor</h2>
              <label>Doctor Name</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />

              <label>Specialization</label>
              <input
                value={editForm.specialization}
                onChange={(e) => setEditForm({ ...editForm, specialization: e.target.value })}
                required
              />

              <label>Availability</label>
              <select
                value={editForm.availability}
                onChange={(e) => setEditForm({ ...editForm, availability: e.target.value })}
              >
                <option value="Available">Available</option>
                <option value="Unavailable">Unavailable</option>
              </select>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditingDoctor(null)}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <DoctorForm onSubmit={handleCreate} />
          )}
        </section>
      )}

      {role === "patient" && bookingDoctor && (
        <section className="booking-panel card">
          <h2>Doctor Profile & Booking</h2>
          <div style={{ marginBottom: "16px", borderBottom: "1px solid #eee", paddingBottom: "12px" }}>
            <h3 style={{ margin: "0 0 6px 0" }}>{bookingDoctor.name}</h3>
            <p style={{ margin: "0 0 4px 0" }}>
              Department: <strong>{bookingDoctor.specialization}</strong>
            </p>
            <p style={{ margin: 0, fontSize: "0.9em", color: "#666" }}>
              This doctor has set availability slots. Select a date below to view open time slots.
            </p>
          </div>

          <form onSubmit={handleBookAppointment}>
            <label>1. Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              required
            />

            {selectedDate && (
              <div style={{ margin: "16px 0" }}>
                <label>2. Available Time Slots</label>
                {availableSlots.length === 0 ? (
                  <p style={{ color: "var(--danger)", fontSize: "0.95rem" }}>
                    No available time slots on this date. Please select another date.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                      gap: "10px",
                      marginTop: "8px",
                    }}
                  >
                    {availableSlots.map((slot) => {
                      const isSel = selectedSlot?._id === slot._id;
                      return (
                        <button
                          type="button"
                          key={slot._id}
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            padding: "10px",
                            borderRadius: "10px",
                            border: isSel ? "1.5px solid var(--primary)" : "1px solid #d1d5db",
                            background: isSel ? "rgba(13, 110, 253, 0.08)" : "#f8fafc",
                            color: isSel ? "var(--primary)" : "var(--dark)",
                            fontWeight: isSel ? "600" : "400",
                          }}
                        >
                          {slot.startTime}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <label>Notes / Symptoms (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Briefly describe reasons or symptoms..."
              rows={2}
            />

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button type="submit" className="btn-primary" disabled={!selectedSlot}>
                Request Appointment
              </button>
              <button type="button" className="btn-secondary" onClick={() => setBookingDoctor(null)}>
                Close Profile
              </button>
            </div>
          </form>
        </section>
      )}
    </div>
  );
}
