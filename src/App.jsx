import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AuthForm from './pages/AuthForm';
import VolunteerDashboard from './pages/VolunteerDashboard';

// Components
import RequireRole from './components/auth/RequireRole';
import RoleSelectionModal from './components/auth/RoleSelectionModal';

// Context
import { ProjectProvider } from './context/ProjectContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <ProjectProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Entry Point */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthForm />} />
            
            {/* Setup Flow (Required for role selection) */}
            <Route 
              path="/setup" 
              element={
                <RequireRole>
                   {/* If RequireRole lets them through but role is null, show modal */}
                   <RoleSelectionModal />
                </RequireRole>
              } 
            />

            {/* Tactical Command Center (Administrator Only) */}
            <Route 
              path="/dashboard" 
              element={
                <RequireRole role="Administrator">
                  <Dashboard />
                </RequireRole>
              } 
            />

            {/* Volunteer Portal (Volunteer Only) */}
            <Route 
              path="/volunteer" 
              element={
                <RequireRole role="Volunteer">
                  <VolunteerDashboard />
                </RequireRole>
              } 
            />

            {/* Catch-all Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ProjectProvider>
    </AuthProvider>
  );
}

export default App;
