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
                  label="Display Name (e.g. Kitchen)"
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {tags.map((tag) => (
                <Card key={tag.id} sx={{ bgcolor: '#181818', borderRadius: 2, border: '1px solid rgba(255,255,255,0.05)' }}>
                  <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>{tag.name || 'Unnamed Tag'}</Typography>
                      <Typography variant="caption" color="text.secondary">UID: {tag.tag_id}</Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Linked Playlist</InputLabel>
                        <Select
                          label="Linked Playlist"
                          value={tag.playlist_id || ''}
                          onChange={(e) => handleLinkPlaylist(tag.tag_id, e.target.value)}
                          size="small"
                        >
                          <MenuItem value=""><em>None</em></MenuItem>
                          {playlists.map(pl => (
                            <MenuItem key={pl.id} value={pl.id}>{pl.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteTag(tag.tag_id)}
                        sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)', '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.2)' } }}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default TagManagement;
