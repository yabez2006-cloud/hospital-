import { useEffect, useState } from "react";
import { fetchDoctors, fetchDoctorAvailability, bookAppointment } from "../api";

export default function BookingForm({ onBooked }) {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");

  useEffect(() => { fetchDoctors().then(setDoctors).catch(() => {}); }, []);

  useEffect(() => {
    if (!selectedDoctor || !date) return setSlots([]);
    fetchDoctorAvailability(selectedDoctor).then((s) => {
      // filter by date
      const d = new Date(date);
      const filtered = s.filter((slot) => new Date(slot.availableDate).toDateString() === d.toDateString());
      setSlots(filtered);
    }).catch(() => setSlots([]));
  }, [selectedDoctor, date]);

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !selectedSlot) return alert("Select doctor and slot");
    try {
      await bookAppointment({ doctor: selectedDoctor, availableDate: date, startTime: selectedSlot });
      onBooked && onBooked();
      alert("Appointment requested — pending doctor approval");
    } catch (err) {
      alert(err.message || "Booking failed");
    }
  };

  return (
    <form onSubmit={submit}>
      <h3>Book Appointment</h3>
      <label>Doctor</label>
      <select value={selectedDoctor} onChange={(e) => setSelectedDoctor(e.target.value)}>
        <option value="">Select</option>
        {doctors.map((d) => <option key={d._id} value={d._id}>{d.name} - {d.specialization}</option>)}
      </select>
      <label>Date</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <label>Available Times</label>
      <select value={selectedSlot} onChange={(e) => setSelectedSlot(e.target.value)}>
        <option value="">Select time</option>
        {slots.map((s) => <option key={s._id} value={s.startTime}>{s.startTime} - {s.endTime}</option>)}
      </select>
      <button type="submit">Book</button>
    </form>
  );
}
