import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const ProtectedRoute = () => {
  const { user } = useUser();

  // For this implementation, we'll consider a user an admin if their name is 'admin'
  // In a real application, this would be a proper role check from a database.
  const isAdmin = user && user.name && user.name.toLowerCase() === 'admin';

  if (!isAdmin) {
    // If user is not an admin, redirect to the home page
    return <Navigate to="/" replace />;
  }

  // If user is an admin, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;
