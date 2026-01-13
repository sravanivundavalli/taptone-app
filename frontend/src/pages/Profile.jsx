import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Avatar, 
  Divider,
  Grid
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import client from '../api/client';

const Profile = () => {
  const { user, login } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || ''
  });

  const handleCopyAccountId = () => {
    navigator.clipboard.writeText(user?.id.toString());
    showNotification('Account ID copied to clipboard', 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Assuming we'll add a PUT /auth/me or similar endpoint
      // For now, let's assume the backend supports updating these fields via a new endpoint
      // Since I don't see one in main.py, I'll stick to the UI for now and we can add the backend part if needed.
      // But per request, I will implement the UI.
      showNotification('Profile updates would happen here (Backend endpoint pending)', 'info');
    } catch (error) {
      showNotification('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        User Profile
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#111' }}>
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                margin: '0 auto 16px', 
                bgcolor: 'primary.main',
                fontSize: '2.5rem'
              }}
            >
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </Avatar>
            <Typography variant="h6">{user?.first_name} {user?.last_name}</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>{user?.email}</Typography>
            
            <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
              <Typography variant="caption" display="block" color="text.secondary">ACCOUNT ID (for hardware events)</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{user?.id}</Typography>
                <Button size="small" onClick={handleCopyAccountId} startIcon={<ContentCopyIcon sx={{ fontSize: '1rem' }} />}>
                  Copy
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, bgcolor: '#111' }}>
            <Typography variant="h6" gutterBottom>Edit Details</Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Box component="form" onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    disabled
                    value={formData.email}
                  />
                  <Typography variant="caption" color="text.secondary">Email cannot be changed.</Typography>
                </Grid>
                <Grid item xs={12} sx={{ mt: 2 }}>
                  <Button variant="contained" type="submit" disabled={loading}>
                    Update Profile
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Profile;
