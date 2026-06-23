import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchDoctors, fetchMyPatientProfile, updateFavoriteDoctor as saveFavoriteDoctor } from "../api";
import { getAuthUser } from "../auth";

export default function FavoriteDoctors() {
  const user = getAuthUser();
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [favoriteDoctor, setFavoriteDoctor] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "patient") {
      return;
    }

    const loadData = async () => {
      try {
        const [doctorData, patientProfile] = await Promise.all([fetchDoctors(), fetchMyPatientProfile()]);
        setDoctors(doctorData);
        setFavoriteDoctor(patientProfile.favoriteDoctor || null);
        setSelectedDoctor(patientProfile.favoriteDoctor?._id || patientProfile.favoriteDoctor || "");
      } catch (err) {
        setError(err.message);
      }
    };

    loadData();
  }, [user?.role]);

  const handleFavoriteDoctor = async (doctorId) => {
    try {
      const updatedPatient = await saveFavoriteDoctor(doctorId);
      setSelectedDoctor(doctorId);
      setFavoriteDoctor(updatedPatient.favoriteDoctor);
    } catch (err) {
      setError(err.message);
    }
  };

  if (user?.role !== "patient") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <section>
      <h2>Favorite Doctors</h2>
      {error && <div className="error">{error}</div>}

      <div className="card">
        <p><strong>Patient:</strong> {user?.username || "Patient"}</p>
        <p><strong>Selected Favorite Doctor:</strong> {favoriteDoctor?.name || "Not selected"}</p>
        <div className="favorites-grid">
          {doctors.map((doctor) => (
            <button
              type="button"
              key={doctor._id}
              className={selectedDoctor === doctor._id ? "favorite-doctor-card active" : "favorite-doctor-card"}
              onClick={() => handleFavoriteDoctor(doctor._id)}
            >
              <strong>{doctor.name}</strong>
              <span>{doctor.specialization}</span>
              <small>{doctor.availability}</small>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}