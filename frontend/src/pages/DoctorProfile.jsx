import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchMyDoctorProfile } from "../api";
import { getAuthUser } from "../auth";

export default function DoctorProfile() {
  const user = getAuthUser();
  const [doctor, setDoctor] = useState(null);
  
  const [error, setError] = useState("");
  

  useEffect(() => {
    if (user?.role !== "doctor") {
      return;
    }

    const loadProfile = async () => {
      try {
        const profile = await fetchMyDoctorProfile();
        setDoctor(profile);
      } catch (err) {
        setError(err.message);
      }
    };
    loadProfile();
  }, [user?.role, user?.username]);

  

  if (user?.role !== "doctor") {
    return <Navigate to="/dashboard" replace />;
  }

  if (error) {
    return (
      <section>
        <h2>My Profile</h2>
        <div className="error">{error}</div>
      </section>
    );
  }

  if (!doctor) {
    return (
      <section>
        <h2>My Profile</h2>
        <div>Loading profile...</div>
      </section>
    );
  }

  return (
    <section>
      <h2>My Profile</h2>

      <div className="card">
        <p><strong>Name:</strong> {doctor.name || "Doctor"}</p>
        <p><strong>Specialization:</strong> {doctor?.specialization || "Not assigned"}</p>
      </div>

      {/* Availability moved to separate page */}
    </section>
  );
}