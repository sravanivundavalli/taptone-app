import React, { useState } from 'react';
import { TextField, Button, Paper, Typography, Container, Box, Link, FormControlLabel, Checkbox } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Assuming login function in AuthContext is updated to handle rememberMe
      await login(email, password, rememberMe);
      showNotification('Welcome back to TapTone!', 'success');
      navigate('/store');
    } catch (err) {
      showNotification('Invalid email or password', 'error');
    }
  };

  return (
    <Box sx={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', py: 8 }}>
      <Container maxWidth="xs" sx={{ display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 400 }}>
          <Paper elevation={0} sx={{ p: 4, width: '100%', bgcolor: '#0F0F0F', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>
            <Typography component="h1" variant="h4" align="center" sx={{ mb: 4, fontWeight: 900, color: 'primary.main' }}>
              TapTone
            </Typography>
            <Typography variant="h6" align="center" sx={{ mb: 4, opacity: 0.8 }}>
              Log in to continue
            </Typography>
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 1 }}
              />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)}
                    color="primary"
                    sx={{ color: 'rgba(255,255,255,0.3)' }}
                  />
                }
                label={<Typography variant="body2" sx={{ opacity: 0.7 }}>Remember me (30 days)</Typography>}
                sx={{ mb: 2, ml: 0 }}
              />
              <Button 
                type="submit" 
                fullWidth 
                variant="contained" 
                color="primary"
                sx={{ py: 1.5, mb: 3, fontSize: '1.1rem', borderRadius: '30px' }}
              >
                Sign In
              </Button>
              <Box textAlign="center">
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Don't have an account? {' '}
                  <Link component={RouterLink} to="/signup" sx={{ color: 'primary.main', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    Sign Up
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

export default Login;
