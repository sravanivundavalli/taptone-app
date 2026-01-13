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
        <Typography variant="h4" sx={{ mb: { xs: 2, md: 4 }, color: 'white', fontWeight: 800, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>NFC Tag Management</Typography>
        
        <Grid container spacing={{ xs: 2, md: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: { xs: 2, md: 3 }, bgcolor: '#0F0F0F', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontSize: { xs: '1rem', md: '1.25rem' } }}>Register New Tag</Typography>
              <form onSubmit={handleRegisterTag}>
                <TextField
                  fullWidth
                  label="Physical Tag ID (UID)"
                  value={newTagId}
                  onChange={(e) => setNewTagId(e.target.value)}
                  margin="dense"
                  required
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Display Name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  margin="dense"
                  size="small"
                />
                <Button 
                  type="submit" 
                  variant="contained" 
                  fullWidth 
                  sx={{ mt: 2, borderRadius: '20px', py: 1.5, fontWeight: 700, minHeight: 44 }}
                >
                  Register Tag
                </Button>
              </form>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
              {tags.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4, opacity: 0.5 }}>
                  <Typography variant="body2">No tags registered yet.</Typography>
                </Box>
              )}
              {tags.map((tag) => (
                <Paper 
                  key={tag.id} 
                  elevation={0}
                  sx={{ 
                    p: { xs: 2, md: 3 },
                    bgcolor: '#0F0F0F', 
                    borderRadius: 3, 
                    border: '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      border: '1px solid rgba(187, 134, 252, 0.3)',
                      bgcolor: '#1A1A1A'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: 'white', mb: 0.5, fontSize: { xs: '0.9rem', md: '1.1rem' } }}>
                        {tag.name || 'Unnamed Tag'}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          bgcolor: 'rgba(255,255,255,0.05)', 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1,
                          fontFamily: 'monospace',
                          color: 'primary.main',
                          fontSize: '0.7rem'
                        }}
                      >
                        UID: {tag.tag_id}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
                      <FormControl fullWidth sx={{ minWidth: { xs: 'auto', sm: 200 } }}>
                        <InputLabel id={`label-${tag.id}`} size="small">Assign Playlist</InputLabel>
                        <Select
                          labelId={`label-${tag.id}`}
                          label="Assign Playlist"
                          value={tag.playlist_id || ''}
                          onChange={(e) => handleLinkPlaylist(tag.tag_id, e.target.value)}
                          size="small"
                          sx={{ borderRadius: 2, height: 44 }}
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
                          p: 1.25,
                          minWidth: 44,
                          minHeight: 44,
                          '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.15)' } 
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
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
