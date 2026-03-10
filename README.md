# skillCred

## Project overview
This workspace contains two main folders: Backend and Frontend. This README explains how to install, run, and the backend API routes and file hierarchy.

## Prerequisites
- Node.js (v18+ recommended)
- npm

## Install
1. Install backend dependencies

```bash
cd Backend
npm install
```

2. Install frontend dependencies

```bash
cd ../Frontend
npm install
```

## Run (development)

- Start backend (watch + ts-node)

```bash
cd Backend
npm run dev
```

- Start frontend (Vite)

```bash
cd Frontend
npm run dev
```

## Run (production build)

- Build backend

```bash
cd Backend
npm run build
npm start
```

- Build frontend

```bash
cd Frontend
npm run build
npm run preview
```

## Backend API routes
All backend routes are mounted under the `/api` prefix (see [Backend/src/app.ts](Backend/src/app.ts#L1)). Below are the available endpoints, HTTP method, and the file that implements them.

- GET /api/status — health check
  - Implemented in [Backend/src/routes/status.ts](Backend/src/routes/status.ts#L1)

- POST /api/resumes — upload a resume (multipart/form-data)
  - Form field name: `resume`
  - Accepts only PDF files, max 10MB
  - Implemented in [Backend/src/routes/resumes/index.ts](Backend/src/routes/resumes/index.ts#L1)

- POST /api/assessments/interview — interview assessment endpoint (not implemented)
  - Implemented in [Backend/src/routes/assessments/interview.ts](Backend/src/routes/assessments/interview.ts#L1)

- POST /api/assessments/test — test assessment endpoint (not implemented)
  - Implemented in [Backend/src/routes/assessments/test.ts](Backend/src/routes/assessments/test.ts#L1)

- POST /api/integrations/github/analyze — GitHub integration analyze endpoint (not implemented)
  - Implemented in [Backend/src/routes/integrations/github.ts](Backend/src/routes/integrations/github.ts#L1)

Notes:
- The router mount points are defined in [Backend/src/routes/index.ts](Backend/src/routes/index.ts#L1).
- CORS is configured in [Backend/src/app.ts](Backend/src/app.ts#L1) to allow `http://localhost:5173` (change if needed).

## File hierarchy (root-level)
- [Backend](Backend)
- [Frontend](Frontend)

## Key backend files
- [Backend/src/app.ts](Backend/src/app.ts#L1) — Express app setup and route mounting.
- [Backend/src/index.ts](Backend/src/index.ts#L1) — Server start script.
- [Backend/src/routes/index.ts](Backend/src/routes/index.ts#L1) — API route registration.

## Key frontend files
- [Frontend/index.html](Frontend/index.html#L1)
- [Frontend/src/main.tsx](Frontend/src/main.tsx#L1)
- [Frontend/src/App.tsx](Frontend/src/App.tsx#L1)

## Useful notes
- Resume uploads use `multer` memory storage; if you plan to persist uploads, update the storage strategy in [Backend/src/routes/resumes/index.ts](Backend/src/routes/resumes/index.ts#L1).
- Several endpoints return `501 Not implemented yet` — these are placeholders to implement business logic.

If you want, I can also:
- Add example curl/HTTP requests for each endpoint
- Wire-in a simple implementation for any `501` endpoints
