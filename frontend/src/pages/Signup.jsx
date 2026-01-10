import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Container, Box, Link, Grid } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const { signup, login } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signup(formData.email, formData.password, formData.firstName, formData.lastName);
      showNotification('Account created successfully! Logging you in...', 'success');
      
      // Auto-login after signup
      await login(formData.email, formData.password);
      navigate('/store');
    } catch (err) {
      console.error('Signup failed', err);
      const detail = err.response?.data?.detail || 'Registration failed. Please try again.';
      showNotification(detail, 'error');
    }
  };

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', py: 8 }}>
      <Container maxWidth="xs" sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 400 }}>
          <Paper elevation={0} sx={{ p: 4, width: '100%', bgcolor: '#181818', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
            <Typography component="h1" variant="h4" align="center" sx={{ mb: 4, fontWeight: 900, color: 'primary.main' }}>
              TapTone
            </Typography>
            <Typography variant="h6" align="center" sx={{ mb: 4, opacity: 0.8 }}>
              Create your account
            </Typography>
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                sx={{ mb: 1 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                sx={{ mb: 1 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                sx={{ mb: 1 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                sx={{ mb: 1 }}
              />
              <Button 
                type="submit" 
                fullWidth 
                variant="contained" 
                color="primary"
                sx={{ mt: 3, py: 1.5, mb: 3, fontSize: '1.1rem', borderRadius: '30px' }}
              >
                Sign Up
              </Button>
              <Box textAlign="center">
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Already have an account? {' '}
                  <Link component={RouterLink} to="/login" sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    Log In
                  </Link>
                </Typography>
              </Box>
            </form>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

export default Signup;
