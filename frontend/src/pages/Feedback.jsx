import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { createFeedback, fetchFeedback } from "../api";
import { getAuthUser } from "../auth";

export default function Feedback() {
  const user = getAuthUser();
  const role = user?.role || "patient";
  const [patientName, setPatientName] = useState(user?.username || "");
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [error, setError] = useState("");

  const loadFeedback = async () => {
    try {
      if (role === "admin") {
        setFeedbacks(await fetchFeedback());
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const submitFeedback = async (event) => {
    event.preventDefault();
    try {
      await createFeedback({ patientName, rating: Number(rating), comment });
      setPatientName("");
      setRating("");
      setComment("");
      loadFeedback();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!["admin", "patient"].includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <section>
      <h2>{role === "admin" ? "View Feedback" : "Give Feedback"}</h2>
      {error && <div className="error">{error}</div>}

      {role === "admin" ? null : (
        <form onSubmit={submitFeedback}>
          <label>Patient Name</label>
          <input value={patientName} onChange={(e) => setPatientName(e.target.value)} required />

          <label>Rating</label>
          <select value={rating} onChange={(e) => setRating(e.target.value)} required>
            <option value="">Select rating</option>
            <option value="5">★★★★★</option>
            <option value="4">★★★★☆</option>
            <option value="3">★★★☆☆</option>
            <option value="2">★★☆☆☆</option>
            <option value="1">★☆☆☆☆</option>
          </select>

          <label>Comment</label>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} required />

          <button type="submit">Submit Feedback</button>
        </form>
      )}

      {role === "admin" ? (
        <div className="feedback-list">
          <h3>Recent Feedback</h3>
          {feedbacks.map((item) => (
            <div className="feedback-item" key={item._id}>
              <strong>{item.patientName}</strong>
              <div>{"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}</div>
              <p>{item.comment}</p>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}