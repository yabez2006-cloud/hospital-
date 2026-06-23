import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchMyDoctorProfile, updateMyDoctorProfile } from "../api";
import { getAuthUser } from "../auth";

export default function DoctorProfile() {
  const user = getAuthUser();
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState("Available");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "doctor") {
      return;
    }

    const loadProfile = async () => {
      try {
        const profile = await fetchMyDoctorProfile();
        setDoctor(profile);
        setAvailability(profile?.availability || "Available");
      } catch (err) {
        setError(err.message);
      }
    };

    loadProfile();
  }, [user?.role, user?.username]);

  const saveAvailability = async (value) => {
    try {
      const updatedDoctor = await updateMyDoctorProfile({ availability: value });
      setDoctor(updatedDoctor);
      setAvailability(updatedDoctor.availability || value);
    } catch (err) {
      setError(err.message);
    }
  };

  if (user?.role !== "doctor") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <section>
      <h2>My Profile</h2>
      {error && <div className="error">{error}</div>}

      <div className="card">
        <p><strong>Name:</strong> {doctor?.name || user?.username || "Doctor"}</p>
        <p><strong>Specialization:</strong> {doctor?.specialization || "Not assigned"}</p>

        <div className="availability-group">
          <label>Doctor Availability</label>
          <label>
            <input type="radio" checked={availability === "Available"} onChange={() => saveAvailability("Available")} />
            Available
          </label>
          <label>
            <input type="radio" checked={availability === "Unavailable"} onChange={() => saveAvailability("Unavailable")} />
            Unavailable
          </label>
        </div>
      </div>
    </section>
  );
}