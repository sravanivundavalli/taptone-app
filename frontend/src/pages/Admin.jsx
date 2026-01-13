import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Button, Box, TextField, Dialog, DialogTitle, 
  DialogContent, DialogActions, TableSortLabel, useMediaQuery, useTheme 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import client from '../api/client';

const Admin = () => {
  const [songs, setSongs] = useState([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentSongId, setCurrentSongId] = useState(null);
  const [file, setFile] = useState(null);
  const [songData, setSongData] = useState({ title: '', artist: '', genre: 'Pop', price: 0.99 });
  
  const [orderBy, setOrderBy] = useState('title');
  const [order, setOrder] = useState('asc');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    const response = await client.get('/songs');
    setSongs(response.data);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedSongs = [...songs].sort((a, b) => {
    const valA = (a[orderBy] || '').toString().toLowerCase();
    const valB = (b[orderBy] || '').toString().toLowerCase();
    
    if (order === 'asc') {
      return valA.localeCompare(valB);
    } else {
      return valB.localeCompare(valA);
    }
  });

  const handleOpenAdd = () => {
    setEditMode(false);
    setSongData({ title: '', artist: '', genre: 'Pop', price: 0.99 });
    setFile(null);
    setOpen(true);
  };

  const handleOpenEdit = (song) => {
    setEditMode(true);
    setCurrentSongId(song.id);
    setSongData({ title: song.title, artist: song.artist, genre: song.genre, price: song.price });
    setFile(null);
    setOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this song?')) {
      try {
        await client.delete(`/songs/${id}`);
        fetchSongs();
      } catch (error) {
        console.error('Delete failed', error);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (editMode) {
        await client.put(`/songs/${currentSongId}`, songData);
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', songData.title);
        formData.append('artist', songData.artist);
        formData.append('genre', songData.genre);
        formData.append('price', songData.price);
        await client.post('/songs/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setOpen(false);
      fetchSongs();
    } catch (error) {
      console.error('Operation failed', error);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100%', pt: 4, pb: 8 }}>
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 2, mb: 4 }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, fontSize: { xs: '1.5rem', md: '2.125rem' } }}>Admin Dashboard</Typography>
          <Button 
            variant="contained" 
            startIcon={<CloudUploadIcon />}
            onClick={handleOpenAdd}
            sx={{ borderRadius: '20px', minHeight: 44 }}
          >
            Upload Song
          </Button>
        </Box>

        {isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sortedSongs.map((song) => (
              <Paper key={song.id} sx={{ p: 2, bgcolor: '#0F0F0F', borderRadius: 3, border: '1px solid rgba(255,255,255,0.05)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'white' }}>{song.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{song.artist} • {song.genre}</Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main', mt: 0.5, fontWeight: 600 }}>${song.price.toFixed(2)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="medium" onClick={() => handleOpenEdit(song)} sx={{ bgcolor: 'rgba(187, 134, 252, 0.05)', color: 'primary.main' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="medium" onClick={() => handleDelete(song.id)} sx={{ bgcolor: 'rgba(244, 67, 54, 0.05)', color: 'error.main' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ bgcolor: '#0F0F0F', borderRadius: 4 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 700 }}>
                    <TableSortLabel
                      active={orderBy === 'title'}
                      direction={orderBy === 'title' ? order : 'asc'}
                      onClick={() => handleRequestSort('title')}
                      sx={{ color: 'primary.main !important' }}
                    >
                      Title
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 700 }}>
                    <TableSortLabel
                      active={orderBy === 'artist'}
                      direction={orderBy === 'artist' ? order : 'asc'}
                      onClick={() => handleRequestSort('artist')}
                      sx={{ color: 'primary.main !important' }}
                    >
                      Artist
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 700 }}>
                    <TableSortLabel
                      active={orderBy === 'genre'}
                      direction={orderBy === 'genre' ? order : 'asc'}
                      onClick={() => handleRequestSort('genre')}
                      sx={{ color: 'primary.main !important' }}
                    >
                      Genre
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 700 }}>
                    <TableSortLabel
                      active={orderBy === 'price'}
                      direction={orderBy === 'price' ? order : 'asc'}
                      onClick={() => handleRequestSort('price')}
                      sx={{ color: 'primary.main !important' }}
                    >
                      Price
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: 'primary.main', fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedSongs.map((song) => (
                  <TableRow key={song.id} sx={{ '&:hover': { bgcolor: '#1A1A1A' } }}>
                    <TableCell sx={{ color: 'white' }}>{song.title}</TableCell>
                    <TableCell sx={{ color: 'white', opacity: 0.7 }}>{song.artist}</TableCell>
                    <TableCell sx={{ color: 'white', opacity: 0.7 }}>{song.genre}</TableCell>
                    <TableCell sx={{ color: 'white', opacity: 0.7 }}>${song.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleOpenEdit(song)} color="primary" sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(song.id)} color="error">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog 
          open={open} 
          onClose={() => setOpen(false)} 
          fullScreen={isMobile}
          PaperProps={{ sx: { bgcolor: '#0F0F0F', color: 'white', borderRadius: isMobile ? 0 : 4, minWidth: isMobile ? '100%' : 400 } }}
        >          <DialogTitle sx={{ fontWeight: 800 }}>{editMode ? 'Edit Song' : 'Upload New Music'}</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField 
                label="Title" 
                fullWidth 
                value={songData.title} 
                onChange={(e) => setSongData({...songData, title: e.target.value})}
              />
              <TextField 
                label="Artist" 
                fullWidth 
                value={songData.artist} 
                onChange={(e) => setSongData({...songData, artist: e.target.value})}
              />
              <TextField 
                label="Genre" 
                fullWidth 
                value={songData.genre} 
                onChange={(e) => setSongData({...songData, genre: e.target.value})}
              />
              <TextField 
                label="Price" 
                type="number"
                fullWidth 
                value={songData.price} 
                onChange={(e) => setSongData({...songData, price: parseFloat(e.target.value)})}
                inputProps={{ step: 0.01 }}
              />
              {!editMode && (
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ py: 2, borderStyle: 'dashed' }}
                >
                  {file ? file.name : 'Select MP3 File'}
                  <input type="file" hidden accept="audio/mpeg" onChange={(e) => setFile(e.target.files[0])} />
                </Button>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setOpen(false)} sx={{ color: 'white' }}>Cancel</Button>
            <Button variant="contained" onClick={handleSubmit} disabled={(!editMode && !file) || !songData.title}>
              {editMode ? 'Update' : 'Upload'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Admin;
