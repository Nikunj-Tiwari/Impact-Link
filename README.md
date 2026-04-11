# 🌍 ImpactLink: Extreme Orchestration

**Smart Resource Allocation for localized disaster response.**

ImpactLink is a high-fidelity situational awareness platform designed to solve resource misallocation during humanitarian crises. By bridging the gap between fragmented community data and centralized aid orchestration, ImpactLink ensures that every volunteer and supply reaches the area of highest impact.

---

## 🚀 Key Features

- **📍 Spatial Intelligence Layer**: Live Google Maps integration with DBSCAN clustering to identify emergency hotspots across India.
- **👁️ Tactical Ingestion (AI Vision)**: Automated extraction of structured data from handwritten field reports and photos using **Gemini 1.5 Flash**.
- **🧠 Smart-Fill Assistant**: Natural language processing to instantly digitize unstructured reports from the field.
- **🛡️ Secure Processing (PII Protection)**: Industry-standard AES-256 encryption for beneficiary records with a deterministic PII audit log.
- **📈 Impact Simulation**: Predictive modeling to visualize the "What-If" outcomes of responder deployments.

---

## 🛠️ Technology Stack

- **Frontend**: React, Vite, Framer Motion, Lucide React
- **Backend**: Node.js, Express, MongoDB
- **AI/ML**: Google Gemini AI (Vision & Flash)
- **Infrastructure**: Firebase Authentication, Google Maps API
- **Deployment**: Design optimized for Vercel/Render/Firebase Hosting

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Atlas or Local)
- API Keys: Google AI Studio (Gemini), Google Maps, Firebase

### 2. Clone & Install
```bash
git clone https://github.com/yourusername/impactlink.git
cd impactlink
npm install
cd backend && npm install && cd ..
```

### 3. Environment Variables
Create a `.env.local` in the root and a `.env` in the `backend/` folder following the `.env.example` templates provided.

### 4. Running the Application
**Terminal 1 (Backend):**
```bash
cd backend
npm run start
```

**Terminal 2 (Frontend):**
```bash
npm run dev
```

---

## 📁 Repository Structure

```
├── backend/            # Express server & MongoDB models
├── src/                # React components & UI logic
│   ├── components/     # High-fidelity UI elements
│   ├── services/       # API & AI Service layer (Gemini, Firebase)
│   └── pages/          # Main dashboard & Landing interfaces
├── .env.example        # Environment template
└── package.json        # Main project configuration
```

---

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Built for the Google Solutions Hackathon 2026.**
