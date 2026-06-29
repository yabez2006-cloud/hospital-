import { useEffect, useState } from "react";
import { getFavoritesByPatient, addFavorite, removeFavorite } from "../api";

export default function Favorites({ patientId }) {
  const [list, setList] = useState([]);
  const [doctorToAdd, setDoctorToAdd] = useState("");

  const load = () => getFavoritesByPatient(patientId).then(setList).catch(() => {});

  useEffect(() => { if (patientId) load(); }, [patientId]);

  const handleAdd = async () => {
    if (!doctorToAdd) return alert("Doctor id required");
    await addFavorite({ patient: patientId, doctor: doctorToAdd });
    setDoctorToAdd("");
    load();
  };

  const handleRemove = async (id) => { await removeFavorite(id); load(); };

  return (
    <div>
      <h3>Favorites</h3>
      <div>
        <input placeholder="DoctorId" value={doctorToAdd} onChange={(e) => setDoctorToAdd(e.target.value)} />
        <button onClick={handleAdd}>Add Favorite</button>
      </div>
      <ul>
        {list.map((f) => (
          <li key={f._id}>{f.doctor?.name || f.doctor} <button onClick={() => handleRemove(f._id)}>Remove</button></li>
        ))}
      </ul>
    </div>
  );
}
