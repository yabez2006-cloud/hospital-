import { useEffect, useState } from "react";
import { createFeedback, fetchFeedback } from "../api";

export default function Feedback() {
  const [patientName, setPatientName] = useState("");
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [feedbacks, setFeedbacks] = useState([]);
  const [error, setError] = useState("");

  const loadFeedback = async () => {
    try {
      setFeedbacks(await fetchFeedback());
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

  return (
    <section>
      <h2>Patient Feedback</h2>
      {error && <div className="error">{error}</div>}

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
    </section>
  );
}