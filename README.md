# Hospital Management

This repository contains a full-stack hospital management system with an Express/MongoDB backend and a React frontend.

## Backend

Folder: `backend`

Install dependencies:

```bash
cd backend
npm install
```

Run the server:

```bash
npm run dev
```

The backend API is available at `http://localhost:4000`.

## Frontend

Folder: `frontend`

Install dependencies:

```bash
cd frontend
npm install
```

Run the frontend:

```bash
npm run dev
```

The frontend will start with Vite and use the backend API at `http://localhost:4000/api` by default.

## Run from repository root

Install all dependencies:

```bash
npm install --prefix backend
npm install --prefix frontend
```

Run the backend from the repo root (port 4000):

```bash
npm run dev:backend
```

Run the frontend from the repo root (port 5173) in a new terminal:

```bash
npm run dev:frontend
```

Both will start automatically. Open http://localhost:5173 in your browser.

## Notes

- Backend runs on port `4000` (Express server).
- Frontend runs on port `5173` (Vite dev server).
- Backend uses MongoDB Atlas if `backend/.env` provides `MONGO_URI`; otherwise it falls back to local MongoDB or in-memory storage.
- Create `backend/.env` to override `MONGO_URI` or `PORT`.
- Set `MONGO_URI` to your Atlas connection string in `backend/.env`.
- Frontend connects to backend at `http://localhost:4000/api` through the Vite proxy.
