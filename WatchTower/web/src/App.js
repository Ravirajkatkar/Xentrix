import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './components/authentication/login.index';
import DashboardLayout from './components/layout/DashboardLayout';
import Overview from './components/dashboard/overview/overview.index';
import Clients from './components/dashboard/clients/clients.index';
import Employees from './components/dashboard/employees/employees.index';
import ProtectedRoute from './components/layout/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Overview />} />
            <Route path="clients" element={<Clients />} />
            <Route path="employees" element={<Employees />} />
            {/* Fallback for other sidebar routes until they are built */}
            <Route path="*" element={
              <div style={{ marginLeft: 260, padding: 40, color: 'var(--text)' }}>
                <h2>Coming Soon</h2>
                <p>This module is under development.</p>
              </div>
            } />
          </Route>
        </Route>
        
        {/* Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
