import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DevicesIcon from '@mui/icons-material/Devices';
import { useNotification } from '../context/NotificationContext';
import client from '../api/client';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimCode, setClaimCode] = useState('');
  const [claiming, setClaiming] = useState(false);
  const { showNotification } = useNotification();

  const fetchDevices = async () => {
    try {
      const response = await client.get('/api/v1/my-devices');
      setDevices(response.data);
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!claimCode || claimCode.length !== 6) {
      showNotification('Please enter a valid 6-digit claim code', 'error');
      return;
    }

    setClaiming(true);
    try {
      const response = await client.post(`/api/v1/devices/claim-verify?code=${claimCode.toUpperCase()}`);
      showNotification('Device claimed successfully!', 'success');
      setClaimCode('');
      fetchDevices();
    } catch (error) {
      showNotification(error.response?.data?.detail || 'Failed to claim device', 'error');
    } finally {
      setClaiming(false);
    }
  };

  const handleDelete = async (deviceId) => {
    if (!window.confirm('Are you sure you want to remove this device?')) return;

    try {
      await client.delete(`/api/v1/devices/${deviceId}`);
      showNotification('Device removed', 'success');
      fetchDevices();
    } catch (error) {
      showNotification('Failed to remove device', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Kiosk Management
      </Typography>
      
      <Paper sx={{ p: 3, mb: 4, bgcolor: '#111' }}>
        <Typography variant="h6" gutterBottom>
          Pair New Device
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
          Enter the 6-digit code displayed on your Raspberry Pi kiosk.
        </Typography>
        <Box component="form" onSubmit={handleClaim} sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Claim Code"
            variant="outlined"
            size="small"
            value={claimCode}
            onChange={(e) => setClaimCode(e.target.value)}
            inputProps={{ maxLength: 6, style: { textTransform: 'uppercase' } }}
            disabled={claiming}
          />
          <Button 
            variant="contained" 
            type="submit" 
            disabled={claiming || claimCode.length !== 6}
          >
            {claiming ? <CircularProgress size={24} /> : 'Claim Device'}
          </Button>
        </Box>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Your Devices
      </Typography>
      {devices.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#111' }}>
          <DevicesIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">No kiosks paired yet.</Typography>
        </Paper>
      ) : (
        <List>
          {devices.map((device) => (
            <Paper key={device.id} sx={{ mb: 2, bgcolor: '#111' }}>
              <ListItem>
                <ListItemText
                  primary={device.name || `Device ${device.id.substring(0, 8)}`}
                  secondary={
                    <Box sx={{ mt: 0.5 }}>
                      <Chip 
                        size="small" 
                        label={device.last_seen && (Date.now() / 1000 - device.last_seen < 60) ? 'Online' : 'Offline'}
                        color={device.last_seen && (Date.now() / 1000 - device.last_seen < 60) ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        ID: {device.id}
                      </Typography>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleDelete(device.id)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            </Paper>
          ))}
        </List>
      )}
    </Container>
  );
};

export default Devices;
