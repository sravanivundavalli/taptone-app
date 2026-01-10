import React, { useState, useEffect } from 'react';
import { 
  Container, Grid, Card, CardContent, Typography, Box, 
  Checkbox, Button, IconButton, Paper, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, List, ListItem, ListItemText, ListItemSecondaryAction,
  Skeleton
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ClearIcon from '@mui/icons-material/Clear';
import client from '../api/client';
import { usePlayer } from '../components/AudioPlayer';
import { useNotification } from '../context/NotificationContext';

const MyCollection = () => {
  const [songs, setSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Playlist Creation
  const [showPlaylistDialog, setShowPlaylistDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  
  // Playlist Editing
  const [editingPlaylist, setEditingPlaylist] = useState(null);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [playlistToRename, setPlaylistToRename] = useState(null);
  
  const { playSong } = usePlayer();
  const { showNotification } = useNotification();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchCollection(), fetchPlaylists()]);
      setLoading(false);
    };
    init();
  }, []);

  const fetchCollection = async () => {
    try {
      const response = await client.get('/my-collection');
      setSongs(response.data);
    } catch (error) {
      showNotification('Failed to load collection', 'error');
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

  const handleToggleSong = (songId) => {
    setSelectedSongs(prev => 
      prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]
    );
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName) return;
    try {
      const res = await client.post('/playlists', { name: newPlaylistName });
      const playlistId = res.data.id;
      
      if (selectedSongs.length > 0) {
        await client.put(`/playlists/${playlistId}/songs`, selectedSongs);
        setSelectedSongs([]);
      }
      
      setNewPlaylistName('');
      setShowPlaylistDialog(false);
      fetchPlaylists();
      showNotification('Playlist created!', 'success');
    } catch (error) {
      showNotification('Failed to create playlist', 'error');
    }
  };

  const handleUpdatePlaylistSongs = async (playlist, songId, action) => {
    const currentSongIds = playlist.songs.map(s => s.id);
    let newSongIds;
    if (action === 'add') {
      newSongIds = [...currentSongIds, ...selectedSongs];
    } else {
      newSongIds = currentSongIds.filter(id => id !== songId);
    }
    
    try {
      await client.put(`/playlists/${playlist.id}/songs`, [...new Set(newSongIds)]);
      fetchPlaylists();
      setSelectedSongs([]);
      showNotification('Playlist updated!', 'success');
    } catch (error) {
      showNotification('Update failed', 'error');
    }
  };

  const handleDeletePlaylist = async (id) => {
    try {
      await client.delete(`/playlists/${id}`);
      fetchPlaylists();
      showNotification('Playlist deleted', 'info');
    } catch (error) {
      showNotification('Delete failed', 'error');
    }
  };

  const handleRenamePlaylist = async () => {
    if (!renameValue || !playlistToRename) return;
    try {
      await client.put(`/playlists/${playlistToRename.id}`, { name: renameValue });
      fetchPlaylists();
      setShowRenameDialog(false);
      setRenameValue('');
      setPlaylistToRename(null);
      showNotification('Playlist renamed!', 'success');
    } catch (error) {
      showNotification('Rename failed', 'error');
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100%', pt: 4, pb: 8 }}>
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 3fr' }, gap: 4 }}>
          
          {/* Left Column: Playlists */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>Playlists</Typography>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<AddIcon />}
                onClick={() => setShowPlaylistDialog(true)}
                sx={{ borderRadius: '20px' }}
              >
                New
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {loading ? (
                Array.from(new Array(3)).map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
                ))
              ) : playlists.map(pl => (
                <Paper 
                  key={pl.id} 
                  sx={{ 
                    p: 2, 
                    bgcolor: '#181818', 
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.05)',
                    position: 'relative',
                    '&:hover': { bgcolor: '#222' }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box onClick={() => setEditingPlaylist(editingPlaylist?.id === pl.id ? null : pl)} sx={{ cursor: 'pointer', flex: 1 }}>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>{pl.name}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.6 }}>{pl.songs.length} songs</Typography>
                    </Box>
                    <Box>
                      {selectedSongs.length > 0 && (
                        <IconButton size="small" color="primary" onClick={() => handleUpdatePlaylistSongs(pl, null, 'add')}>
                          <AddIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton 
                        size="small" 
                        onClick={() => {
                          setPlaylistToRename(pl);
                          setRenameValue(pl.name);
                          setShowRenameDialog(true);
                        }} 
                        sx={{ opacity: 0.3 }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeletePlaylist(pl.id)} sx={{ opacity: 0.3 }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  {editingPlaylist?.id === pl.id && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                      <List size="small" disablePadding>
                        {pl.songs.map(song => (
                          <ListItem key={song.id} disableGutters sx={{ py: 0.5 }}>
                            <ListItemText 
                              primary={song.title} 
                              primaryTypographyProps={{ variant: 'caption', fontWeight: 600 }}
                            />
                            <ListItemSecondaryAction>
                              <IconButton size="small" onClick={() => handleUpdatePlaylistSongs(pl, song.id, 'remove')}>
                                <ClearIcon fontSize="inherit" />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </Paper>
              ))}
            </Box>
          </Box>

          {/* Right Column: Collection Grid */}
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 800 }}>My Collection</Typography>
              {selectedSongs.length > 0 && (
                <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700 }}>
                  {selectedSongs.length} songs selected
                </Typography>
              )}
            </Box>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
              gap: 3 
            }}>
              {loading ? (
                Array.from(new Array(6)).map((_, i) => (
                  <Box key={i} sx={{ height: 260, bgcolor: '#181818', borderRadius: 2, p: 2 }}>
                    <Skeleton variant="rectangular" height={130} sx={{ borderRadius: 1.5, mb: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
                    <Skeleton variant="text" width="80%" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                    <Skeleton variant="text" width="60%" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                  </Box>
                ))
              ) : songs.map((song) => (
                <Card 
                  key={song.id}
                  onClick={() => handleToggleSong(song.id)}
                  sx={{ 
                    height: 260,
                    cursor: 'pointer',
                    border: selectedSongs.includes(song.id) ? '2px solid #1DB954' : '2px solid transparent',
                    position: 'relative',
                    bgcolor: '#181818',
                    borderRadius: 2,
                    overflow: 'hidden',
                    '&:hover': { bgcolor: '#282828' },
                    '&:hover .play-btn': { opacity: 1 }
                  }}
                >
                  <Box sx={{ position: 'relative', height: 160, p: 2 }}>
                    <Box
                      component="img"
                      src={song.image_url || `https://picsum.photos/seed/${song.title}/400/400`}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 1.5,
                      }}
                    />
                    <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                      <Checkbox 
                        checked={selectedSongs.includes(song.id)}
                        sx={{ 
                          color: 'white', 
                          '&.Mui-checked': { color: 'primary.main' },
                          bgcolor: 'rgba(0,0,0,0.4)',
                          borderRadius: '4px',
                          p: 0.5
                        }}
                      />
                    </Box>
                    <Box 
                      className="play-btn"
                      sx={{ 
                        position: 'absolute', 
                        bottom: 24, 
                        right: 24,
                        opacity: 0,
                        transition: 'opacity 0.2s'
                      }}
                    >
                      <IconButton 
                        onClick={(e) => {
                          e.stopPropagation();
                          playSong(song);
                        }}
                        sx={{ 
                          bgcolor: 'primary.main', 
                          color: 'black',
                          width: 36,
                          height: 36,
                          boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                          '&:hover': { bgcolor: '#1ed760' }
                        }}
                      >
                        <PlayArrowIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <CardContent sx={{ px: 2, py: 0 }}>
                    <Typography 
                      variant="body2" 
                      title={song.title}
                      sx={{ 
                        fontWeight: 700, 
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {song.title}
                    </Typography>
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      title={song.artist}
                      sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block'
                      }}
                    >
                      {song.artist}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Dialogs */}
        <Dialog open={showPlaylistDialog} onClose={() => setShowPlaylistDialog(false)}>
          <DialogTitle>Create New Playlist</DialogTitle>
          <DialogContent>
            <TextField 
              fullWidth 
              label="Playlist Name"
              autoFocus
              value={newPlaylistName} 
              onChange={e => setNewPlaylistName(e.target.value)} 
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPlaylistDialog(false)}>Cancel</Button>
            <Button onClick={handleCreatePlaylist} color="primary" variant="contained">Create</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={showRenameDialog} onClose={() => setShowRenameDialog(false)}>
          <DialogTitle>Rename Playlist</DialogTitle>
          <DialogContent>
            <TextField 
              fullWidth 
              label="New Name"
              autoFocus
              value={renameValue} 
              onChange={e => setRenameValue(e.target.value)} 
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowRenameDialog(false)}>Cancel</Button>
            <Button onClick={handleRenamePlaylist} color="primary" variant="contained">Rename</Button>
          </DialogActions>
        </Dialog>

      </Container>
    </Box>
  );
};

export default MyCollection;
