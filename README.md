# 🌐 ImpactLink: Extreme Orchestration

> **Smart Resource Allocation for Localized Disaster Response**

ImpactLink is a high-fidelity situational awareness platform designed to solve resource misallocation during humanitarian crises. By bridging the gap between fragmented community data and centralized aid orchestration, ImpactLink ensures that every volunteer and supply reaches the area of highest impact.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?logo=firebase)
![Gemini AI](https://img.shields.io/badge/Gemini-1.5_Flash-4285F4?logo=google)
![Built for](https://img.shields.io/badge/Built_for-Google_Solutions_Hackathon_2026-red)

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🗺️ **Spatial Intelligence Layer** | Live Google Maps integration with DBSCAN clustering to identify emergency hotspots across India |
| 📸 **Tactical AI Ingestion** | Automated extraction of structured data from handwritten field reports and photos using **Gemini 1.5 Flash** |
| 🤖 **Smart-Fill Assistant** | Natural language processing to instantly digitize unstructured reports from the field |
| 🔒 **Secure Processing (PII)** | Industry-standard AES-256 encryption for beneficiary records with a deterministic PII audit log |
| 📊 **Impact Simulation** | Predictive modeling to visualize "What-If" outcomes of responder deployments |
| 🙋 **Volunteer Auth** | Dedicated volunteer authentication flow with role-based access |
| 📡 **Dynamic Intelligence Feed** | Real-time crisis feed powered by live data aggregation |

---

## 🛠️ Technology Stack

### Frontend
- **React 18** + **Vite** — fast, modern SPA setup
- **Framer Motion** — smooth, fluid animations
- **Lucide React** — consistent icon system
- **Google Maps API** — spatial visualization

### Backend
- **Node.js** + **Express** — REST API server
- **MongoDB** (Atlas or Local) — document database

### AI / ML
- **Google Gemini 1.5 Flash** — vision & NLP tasks
- **DBSCAN Clustering** — geospatial hotspot detection

### Infrastructure
- **Firebase Authentication** — secure user management
- **AES-256 Encryption** — PII data protection

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js `v18+`
- MongoDB (Atlas or Local)
- API Keys: Google AI Studio (Gemini), Google Maps, Firebase

### 1. Clone & Install

```bash
git clone https://github.com/Nikunj-Tiwari/Impact-Link.git
cd Impact-Link
npm install
cd backend && npm install && cd ..
```

### 2. Environment Variables

Create a `.env.local` in the root directory:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

Create a `.env` in the `backend/` folder:

```env
MONGODB_URI=your_mongodb_connection_string
PORT=5000
ENCRYPTION_KEY=your_aes_256_key
```

### 3. Run the Application

**Terminal 1 — Backend:**
```bash
cd backend
npm run start
```

**Terminal 2 — Frontend:**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

---

## 📁 Repository Structure

```
Impact-Link/
├── backend/                  # Express server & MongoDB models
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API route handlers
│   └── server.js             # Entry point
├── src/                      # React frontend
│   ├── components/           # Reusable UI components
│   ├── pages/                # Main dashboard & landing pages
│   ├── services/             # API & AI service layer (Gemini, Firebase)
│   ├── store/                # Auth context & state management
│   └── App.jsx               # Root application component
├── .env.local                # Environment variables (not committed)
├── package.json              # Frontend dependencies
├── vite.config.js            # Vite configuration
└── README.md                 # This file
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

---

## 👤 Author

**Nikunj Tiwari**
- GitHub: [@Nikunj-Tiwari](https://github.com/Nikunj-Tiwari)
- Email: nikunjtiwari68@gmail.com

---

> **Built for the Google Solutions Hackathon 2026** 🏆
