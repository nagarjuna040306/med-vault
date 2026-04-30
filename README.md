# 🔐 Blockchain EHR System

A full-stack **Electronic Health Records** system secured by **Ethereum smart contracts**, **IPFS encrypted storage**, and **MongoDB** — matching the provided architecture diagrams.

## Architecture

```
Patient Mobile App (React)
        │  REST API (HTTP/JSON)
        ▼
Node.js + Express  ──Ethers.js──▶  Ethereum Smart Contracts (Sepolia)
        │                         ├── ConsentContract.sol
        │  Infura IPFS API        ├── EmergencyAccess.sol
        ├──────────────────────▶  └── AuditLog.sol
        │  IPFS Storage
        │  MongoDB Driver
        └──────────────────────▶  MongoDB (metadata, sessions, profiles)
```

## Project Structure

```
blockchain-ehr/
├── contracts/
│   ├── ConsentContract.sol     # Consent + IPFS hash storage
│   ├── EmergencyAccess.sol     # Break-glass access (2hr expiry)
│   └── AuditLog.sol            # Immutable on-chain event log
├── backend/
│   ├── server.js               # Express entry point
│   ├── routes/
│   │   ├── auth.js             # POST /register, POST /login
│   │   ├── records.js          # POST /upload, GET /records/:id
│   │   ├── consent.js          # POST /grant/:id, POST /revoke/:id
│   │   ├── emergency.js        # POST /emergency, GET /status/:id
│   │   └── audit.js            # GET /audit
│   ├── models/
│   │   ├── Patient.js
│   │   └── Doctor.js
│   ├── utils/
│   │   ├── encryption.js       # AES-256-CBC
│   │   ├── ipfs.js             # Infura IPFS API
│   │   └── blockchain.js       # Ethers.js contract calls
│   ├── middleware/auth.js       # JWT verification
│   └── .env.example
└── frontend/
    └── src/
        ├── App.jsx             # Role-based router
        ├── screens/
        │   ├── AuthScreen.jsx           # Login / Register
        │   ├── PatientDashboard.jsx     # Records, Consent, Audit
        │   ├── DoctorDashboard.jsx      # Record lookup
        │   └── EmergencyDashboard.jsx   # Break-glass access
        └── services/api.js     # Axios API client
```

## Quick Start

### 1. Configure environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI, Infura keys, Sepolia RPC, wallet private key
```

> **Demo Mode**: If `.env` is not configured, the backend runs in demo/mock mode — all blockchain and IPFS calls return mock responses. MongoDB is still required.

### 2. Start Backend
```bash
cd backend
npm install
npm run dev          # Runs on http://localhost:5000
```

### 3. Start Frontend
```bash
cd frontend
npm install
npm run dev          # Runs on http://localhost:5173
```

### 4. Deploy Smart Contracts (Optional – for real blockchain)
```bash
# Use Hardhat or Remix IDE to deploy ConsentContract.sol,
# EmergencyAccess.sol, and AuditLog.sol to Sepolia testnet.
# Copy contract addresses to backend/.env
```

## API Endpoints

| Method | Endpoint                  | Description                          |
|--------|---------------------------|--------------------------------------|
| POST   | `/api/auth/register`      | Register patient or doctor           |
| POST   | `/api/auth/login`         | Login and get JWT                    |
| POST   | `/api/records/upload`     | Encrypt EHR → IPFS → store hash      |
| GET    | `/api/records/:patientId` | Get patient record (if granted)      |
| POST   | `/api/consent/grant/:id`  | Patient grants doctor access         |
| POST   | `/api/consent/revoke/:id` | Patient revokes doctor access        |
| GET    | `/api/consent/doctors`    | List all registered doctors          |
| POST   | `/api/emergency`          | Break-glass emergency access (2hr)   |
| GET    | `/api/emergency/status/:id`| Check emergency session status      |
| GET    | `/api/audit`              | Get on-chain audit log for patient   |

## Smart Contracts

| Contract             | Function                                           |
|----------------------|----------------------------------------------------|
| `ConsentContract`    | `grantAccess`, `revokeAccess`, `storeHash`, `hasAccess` |
| `EmergencyAccess`    | `requestAccess`, `isEmergencyActive`, `getExpiry`  |
| `AuditLog`           | `logEvent`, `getEvents`, `patientEventCount`       |

## Tech Stack
- **Blockchain**: Solidity 0.8.19, Ethers.js v6, Sepolia Testnet
- **Storage**: IPFS via Infura, AES-256-CBC encryption
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, Multer
- **Frontend**: React 18, Vite, Axios, dark glassmorphism UI
