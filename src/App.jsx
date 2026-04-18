import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/Auth/ProtectedRoute';

import { ProjectProvider } from './context/ProjectContext';

function App() {
  return (
    <ProjectProvider>
      <BrowserRouter>
        <Routes>
        {/* Public Entry Point */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Protected Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </BrowserRouter>
    </ProjectProvider>
  );
}

export default App;
