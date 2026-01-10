import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const navButtonStyle = (path, isSpecial = false) => ({
    opacity: isActive(path) ? 1 : 0.8,
    color: isActive(path) ? 'primary.main' : (isSpecial ? 'secondary.main' : 'inherit'),
    borderBottom: isActive(path) ? '2px solid' : 'none',
    borderColor: 'primary.main',
    borderRadius: 0,
    fontWeight: isActive(path) ? 700 : (isSpecial ? 700 : 400),
    '&:hover': { 
      opacity: 1,
      backgroundColor: 'rgba(255, 255, 255, 0.05)'
    }
  });

  return (
    <AppBar position="sticky" sx={{ mb: 0 }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography 
          variant="h5" 
          component={Link} 
          to="/" 
          sx={{ 
            color: 'primary.main', 
            textDecoration: 'none', 
            fontWeight: 800,
            letterSpacing: '-1px'
          }}
        >
          TapTone
        </Typography>
        {user ? (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button component={Link} to="/store" sx={navButtonStyle('/store')}>Store</Button>
            <Button component={Link} to="/my-collection" sx={navButtonStyle('/my-collection')}>Collection</Button>
            <Button component={Link} to="/tags" sx={navButtonStyle('/tags')}>NFC Tags</Button>
            {user.role === 'admin' && (
              <Button component={Link} to="/admin" sx={navButtonStyle('/admin', true)}>Admin</Button>
            )}
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleLogout}
              sx={{ ml: 2, borderRadius: '20px' }}
            >
              Logout
            </Button>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button component={Link} to="/login" sx={navButtonStyle('/login')}>Login</Button>
            <Button variant="contained" color="primary" component={Link} to="/signup" sx={{ borderRadius: '20px' }}>Signup</Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
