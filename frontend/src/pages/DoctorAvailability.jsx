import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { fetchMyDoctorProfile, updateMyDoctorProfile, fetchDoctorAvailability } from "../api";
import { getAuthUser } from "../auth";
import AvailabilityForm from "../components/AvailabilityForm";

export default function DoctorAvailability() {
  const user = getAuthUser();
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState("Available");
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.role !== "doctor") return;
    const load = async () => {
      try {
        const profile = await fetchMyDoctorProfile();
        setDoctor(profile);
        setAvailability(profile?.availability || "Available");
        if (profile?._id) {
          const s = await fetchDoctorAvailability(profile._id);
          setSlots(s || []);
        }
      } catch (e) {
        setError(e.message);
      }
    };
    load();
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

  if (user?.role !== "doctor") return <Navigate to="/dashboard" replace />;

  return (
    <section>
      <h2>Availability</h2>
      {error ? <div className="error">{error}</div> : null}
      <div className="card">
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

        <div style={{ marginTop: 16 }}>
          
          <AvailabilityForm doctorId={doctor?._id} onSaved={async () => {
            const s = await fetchDoctorAvailability(doctor._id);
            setSlots(s || []);
          }} />

          <h4>Upcoming Slots</h4>
          <ul>
            {slots.map((slot) => (
              <li key={slot._id}>{new Date(slot.availableDate).toLocaleDateString()} {slot.startTime} - {slot.endTime} ({slot.status})</li>
            ))}
          </ul>

          
        </div>
      </div>
    </section>
  );
}
