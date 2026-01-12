import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem, IconButton, Avatar, Divider, ListItemIcon } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Logout from '@mui/icons-material/Logout';
import Settings from '@mui/icons-material/Settings';
import Person from '@mui/icons-material/Person';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
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
            
            <IconButton
              onClick={handleClick}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={open ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={open ? 'true' : undefined}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.9rem', fontWeight: 700 }}>
                {(user.first_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              id="account-menu"
              open={open}
              onClose={handleClose}
              onClick={handleClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  bgcolor: '#0F0F0F',
                  color: 'white',
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  minWidth: 180,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: '#0F0F0F',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {user.first_name ? `${user.first_name} ${user.last_name || ''}` : 'User'}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6, display: 'block' }}>
                  {user.email}
                </Typography>
              </Box>
              <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
              <MenuItem onClick={handleLogout} sx={{ mt: 1 }}>
                <ListItemIcon>
                  <Logout fontSize="small" sx={{ color: 'white' }} />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
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
