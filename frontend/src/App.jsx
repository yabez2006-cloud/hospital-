import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import DoctorLogin from "./pages/DoctorLogin";
import PatientLogin from "./pages/PatientLogin";
import Home from "./pages/Home";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import Feedback from "./pages/Feedback";
import DoctorProfile from "./pages/DoctorProfile";
import DoctorAvailability from "./pages/DoctorAvailability";
import DoctorVisitedHistory from "./pages/DoctorVisitedHistory";
import FavoriteDoctors from "./pages/FavoriteDoctors";
import PatientProfile from "./pages/PatientProfile";
import Layout from "./components/Layout";
import RequireAuth from "./components/RequireAuth";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/doctor-login" element={<DoctorLogin />} />
        <Route path="/patient-login" element={<PatientLogin />} />
        <Route path="/register" element={<Navigate to="/patient-login?mode=register" replace />} />
        <Route element={<RequireAuth />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Home />} />
            <Route path="/home" element={<Home />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/doctor-profile" element={<DoctorProfile />} />
            <Route path="/doctor-availability" element={<DoctorAvailability />} />
            <Route path="/doctor-visited-history" element={<DoctorVisitedHistory />} />
            <Route path="/patient-profile" element={<PatientProfile />} />
            <Route path="/favorite-doctors" element={<FavoriteDoctors />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/feedback" element={<Feedback />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
