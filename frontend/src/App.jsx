import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FileManager from './pages/FileManager';
import Layout from './components/Layout';

const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/files" element={<ProtectedRoute><FileManager /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><div className="card text-center"><h3 className="mb-4">Categories</h3><p className="text-muted">This feature is coming soon.</p></div></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><div className="card text-center"><h3 className="mb-4">Analytics</h3><p className="text-muted">This feature is coming soon.</p></div></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><div className="card text-center"><h3 className="mb-4">Profile</h3><p className="text-muted">This feature is coming soon.</p></div></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><div className="card text-center"><h3 className="mb-4">Settings</h3><p className="text-muted">This feature is coming soon.</p></div></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
