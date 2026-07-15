import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePermissions } from '../../hooks/usePermissions';

export default function ProtectedRoute({ requiredPermission, requiredRoles }) {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { hasPermission, hasRole } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (requiredRoles && !hasRole(requiredRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
