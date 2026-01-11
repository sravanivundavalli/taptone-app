import React, { useState, useEffect } from 'react';
import { Container, Typography, Card, CardContent, Grid, Button, TextField, Box, Select, MenuItem, FormControl, InputLabel, Paper, IconButton } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import client from '../api/client';
import { useNotification } from '../context/NotificationContext';

const TagManagement = () => {
  const [tags, setTags] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [newTagId, setNewTagId] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchTags();
    fetchPlaylists();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await client.get('/tags');
      setTags(response.data);
    } catch (error) {
      showNotification('Failed to load tags', 'error');
    }
  };

  const fetchPlaylists = async () => {
    try {
      const response = await client.get('/playlists');
      setPlaylists(response.data);
    } catch (error) {
      showNotification('Failed to load playlists', 'error');
    }
  };

  const handleRegisterTag = async (e) => {
    e.preventDefault();
    try {
      await client.post('/tags', { tag_id: newTagId, name: newTagName });
      setNewTagId('');
      setNewTagName('');
      fetchTags();
      showNotification('Tag registered successfully!', 'success');
    } catch (error) {
      showNotification('Registration failed. Check if Tag ID is unique.', 'error');
    }
  };

  const handleLinkPlaylist = async (tagId, playlistId) => {
    try {
      const pid = playlistId === '' ? null : playlistId;
      await client.put(`/tags/${tagId}/playlist`, { playlist_id: pid });
      fetchTags();
      showNotification('Tag updated!', 'success');
    } catch (error) {
      showNotification('Failed to link playlist', 'error');
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!window.confirm('Are you sure you want to delete this tag registration?')) return;
    try {
      await client.delete(`/tags/${tagId}`);
      fetchTags();
      showNotification('Tag deleted', 'success');
    } catch (error) {
      showNotification('Failed to delete tag', 'error');
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100%', pt: 4, pb: 8 }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ mb: 4, color: 'white', fontWeight: 800 }}>NFC Tag Management</Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, bgcolor: '#181818', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>Register New Tag</Typography>
              <form onSubmit={handleRegisterTag}>
                <TextField
                  fullWidth
                  label="Physical Tag ID (UID)"
                  value={newTagId}
                  onChange={(e) => setNewTagId(e.target.value)}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Display Name (e.g. Melodies)"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  margin="normal"
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  fullWidth 
                  sx={{ mt: 3, borderRadius: '20px', py: 1, fontWeight: 700 }}
                >
                  Register Tag
                </Button>
              </form>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {tags.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8, opacity: 0.5 }}>
                  <Typography>No tags registered yet. Use the form on the left to start.</Typography>
                </Box>
              )}
              {tags.map((tag) => (
                <Paper 
                  key={tag.id} 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    bgcolor: '#181818', 
                    borderRadius: 4, 
                    border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      border: '1px solid rgba(29, 185, 84, 0.3)',
                      bgcolor: '#222222',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'white', mb: 0.5 }}>
                        {tag.name || 'Unnamed Tag'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            bgcolor: 'rgba(255,255,255,0.05)', 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            color: 'primary.main'
                          }}
                        >
                          UID: {tag.tag_id}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <FormControl sx={{ minWidth: 250 }}>
                        <InputLabel id={`label-${tag.id}`}>Assign Playlist</InputLabel>
                        <Select
                          labelId={`label-${tag.id}`}
                          label="Assign Playlist"
                          value={tag.playlist_id || ''}
                          onChange={(e) => handleLinkPlaylist(tag.tag_id, e.target.value)}
                          size="medium"
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value=""><em>Unlinked</em></MenuItem>
                          {playlists.map(pl => (
                            <MenuItem key={pl.id} value={pl.id}>{pl.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteTag(tag.tag_id)}
                        sx={{ 
                          bgcolor: 'rgba(244, 67, 54, 0.05)', 
                          p: 1.5,
                          '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.15)' } 
                        }}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default TagManagement;
