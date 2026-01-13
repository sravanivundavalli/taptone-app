import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, BottomNavigation, BottomNavigationAction, Paper, useMediaQuery, useTheme } from '@mui/material';
import StoreIcon from '@mui/icons-material/Storefront';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import NfcIcon from '@mui/icons-material/Nfc';
import DevicesIcon from '@mui/icons-material/Devices';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { PlayerProvider, usePlayer } from './components/AudioPlayer';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Store from './pages/Store';
import MyCollection from './pages/MyCollection';
import TagManagement from './pages/TagManagement';
import Devices from './pages/Devices';
import Admin from './pages/Admin';

const PrivateRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/store" />;
  return children;
};

const NavigationWrapper = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const location = useLocation();
  const { user } = useAuth();
  const { currentSong } = usePlayer();

  // Bottom padding depends on whether player and nav are visible
  const pbValue = isMobile 
    ? (currentSong ? '120px' : '60px') 
    : (currentSong ? '100px' : '0px');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', pb: pbValue }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, width: '100%' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/store" element={<PrivateRoute><Store /></PrivateRoute>} />
          <Route path="/my-collection" element={<PrivateRoute><MyCollection /></PrivateRoute>} />
          <Route path="/tags" element={<PrivateRoute><TagManagement /></PrivateRoute>} />
          <Route path="/devices" element={<PrivateRoute><Devices /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute adminOnly><Admin /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/store" />} />
        </Routes>
      </Box>

      {isMobile && user && (
        <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200 }} elevation={3}>
          <BottomNavigation
            value={location.pathname}
            showLabels
            sx={{ bgcolor: '#0A0A0A', height: 60 }}
          >
            <BottomNavigationAction 
              label="Store" 
              value="/store" 
              icon={<StoreIcon />} 
              component={Link} 
              to="/store" 
            />
            <BottomNavigationAction 
              label="Library" 
              value="/my-collection" 
              icon={<LibraryMusicIcon />} 
              component={Link} 
              to="/my-collection" 
            />
            <BottomNavigationAction 
              label="Devices" 
              value="/devices" 
              icon={<DevicesIcon />} 
              component={Link} 
              to="/devices" 
            />
            <BottomNavigationAction 
              label="Tags" 
              value="/tags" 
              icon={<NfcIcon />} 
              component={Link} 
              to="/tags" 
            />
            {user.role === 'admin' && (
              <BottomNavigationAction 
                label="Admin" 
                value="/admin" 
                icon={<AdminPanelSettingsIcon />} 
                component={Link} 
                to="/admin" 
              />
            )}
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <NotificationProvider>
          <PlayerProvider>
            <Router>
              <NavigationWrapper />
            </Router>
          </PlayerProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
