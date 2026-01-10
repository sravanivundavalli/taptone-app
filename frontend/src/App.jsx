import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { PlayerProvider } from './components/AudioPlayer';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Store from './pages/Store';
import MyCollection from './pages/MyCollection';
import TagManagement from './pages/TagManagement';
import Admin from './pages/Admin';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/store" />;
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <PlayerProvider>
            <Router>
              <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', pb: '90px' }}>
                <Navbar />
                <Box component="main" sx={{ flexGrow: 1, width: '100%' }}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/store" element={<PrivateRoute><Store /></PrivateRoute>} />
                    <Route path="/my-collection" element={<PrivateRoute><MyCollection /></PrivateRoute>} />
                    <Route path="/tags" element={<PrivateRoute><TagManagement /></PrivateRoute>} />
                    <Route path="/admin" element={<PrivateRoute adminOnly><Admin /></PrivateRoute>} />
                    <Route path="/" element={<Navigate to="/store" />} />
                  </Routes>
                </Box>
              </Box>
            </Router>
          </PlayerProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
