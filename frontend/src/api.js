import { getAuthToken } from "./auth";

const CONFIG_BASE = import.meta.env.VITE_API_URL || null;

const CANDIDATE_BASES = [
  CONFIG_BASE || "/api",
  "http://localhost:5000/api",
  "http://localhost:4000/api",
  "http://localhost:3000/api",
  "http://localhost:3002/api",
  "http://localhost:4003/api",
  "http://localhost:5001/api",
];

async function tryFetch(url, options) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const error = new Error(err.message || err.error || res.statusText || `HTTP ${res.status}`);
      error.isHttpError = true;
      error.status = res.status;
      throw error;
    }
    return await res.json();
  } catch (e) {
    if (e instanceof TypeError && e.message === "Failed to fetch") {
      throw new Error(`Network error: unable to reach the backend. Tried: ${url}`);
    }

    throw e;
  }
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const opts = { ...options, headers };

  let lastError;
  const attemptedUrls = [];
  for (const base of CANDIDATE_BASES) {
    const url = `${base}${path}`;
    attemptedUrls.push(url);
    try {
      return await tryFetch(url, opts);
    } catch (err) {
      if (err && err.isHttpError) {
        throw err;
      }

      lastError = err;
      // try next candidate
    }
  }

  const fallbackMessage = `Network error: unable to reach the backend. Tried: ${attemptedUrls.join(", ")}`;
  const error = lastError instanceof Error ? lastError : new Error(String(lastError || fallbackMessage));
  if (!error.message || error.message === "Failed to fetch") {
    error.message = fallbackMessage;
  }
  throw error;
}

export const apiPost = (path, data) => request(path, { method: "POST", body: JSON.stringify(data) });

export const fetchPatients = () => request("/patients");
export const createPatient = (data) => request("/patients", { method: "POST", body: JSON.stringify(data) });
export const deletePatient = (id) => request(`/patients/${id}`, { method: "DELETE" });

export const fetchDoctors = () => request("/doctors");
export const createDoctor = (data) => request("/doctors", { method: "POST", body: JSON.stringify(data) });
export const deleteDoctor = (id) => request(`/doctors/${id}`, { method: "DELETE" });
export const fetchMyDoctorProfile = () => request("/doctors/me");
export const updateMyDoctorProfile = (data) => request("/doctors/me", { method: "PATCH", body: JSON.stringify(data) });

export const fetchAppointments = () => request("/appointments");
export const createAppointment = (data) => request("/appointments", { method: "POST", body: JSON.stringify(data) });
export const deleteAppointment = (id) => request(`/appointments/${id}`, { method: "DELETE" });

export const fetchDashboard = () => request("/dashboard");

export const fetchFeedback = () => request("/feedback");
export const createFeedback = (data) => request("/feedback", { method: "POST", body: JSON.stringify(data) });

export const fetchMyPatientProfile = () => request("/patients/me");
export const updateFavoriteDoctor = (doctorId) =>
  request("/patients/me/favorite-doctor", { method: "PATCH", body: JSON.stringify({ favoriteDoctor: doctorId }) });

export const loginAdmin = (credentials) => apiPost("/auth/admin-login", credentials);
export const loginDoctor = (credentials) => apiPost("/auth/doctor-login", credentials);
export const loginPatient = (credentials) => apiPost("/auth/patient-login", credentials);
export const loginUser = (credentials) => apiPost("/auth/admin-login", credentials);
export const registerUser = (credentials) => apiPost("/auth/register", credentials);
