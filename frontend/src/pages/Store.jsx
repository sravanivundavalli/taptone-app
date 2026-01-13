import React, { useState, useEffect } from 'react';
import { Container, Grid, Card, CardContent, Typography, CardActions, Button, TextField, Box, Chip, IconButton, Skeleton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../components/AudioPlayer';
import { useNotification } from '../context/NotificationContext';

const Store = () => {
  const [songs, setSongs] = useState([]);
  const [collectionIds, setCollectionIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('title'); // 'title', 'artist', 'genre'
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { playSong } = usePlayer();
  const { showNotification } = useNotification();

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchSongs(), fetchCollection()]);
      setLoading(false);
    };
    init();
  }, []);

  const fetchSongs = async () => {
    try {
      const response = await client.get('/songs');
      setSongs(response.data);
    } catch (error) {
      console.error('Failed to fetch songs', error);
      showNotification('Failed to load store music', 'error');
    }
  };

  const fetchCollection = async () => {
    try {
      const response = await client.get('/my-collection');
      setCollectionIds(new Set(response.data.map(s => s.id)));
    } catch (error) {
      console.error('Failed to fetch collection', error);
    }
  };

  const handlePurchase = async (songId) => {
    try {
      await client.post(`/songs/${songId}/purchase`);
      setCollectionIds(prev => new Set([...prev, songId]));
      showNotification('Song added to your collection!', 'success');
    } catch (error) {
      console.error('Purchase failed', error);
      showNotification('Failed to add song to collection', 'error');
    }
  };

  const genres = ['All', ...new Set(songs.map(song => song.genre))];

  const filteredSongs = songs
    .filter(song => {
      const matchesSearch = song.title.toLowerCase().includes(search.toLowerCase()) || 
                           song.artist.toLowerCase().includes(search.toLowerCase());
      const matchesGenre = selectedGenre === 'All' || song.genre === selectedGenre;
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      const valA = (a[sortBy] || '').toLowerCase();
      const valB = (b[sortBy] || '').toLowerCase();
      return valA.localeCompare(valB);
    });

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100%', pt: 4, pb: 8 }}>
      <Container maxWidth={false} sx={{ px: { xs: 2, md: 4 } }}>
        <Typography variant="h4" sx={{ mb: 4, color: 'white', fontWeight: 800 }}>Browse Music</Typography>
        
        <Box sx={{ mb: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, width: '100%', maxWidth: 800, alignItems: 'center' }}>
            <TextField
              fullWidth
              placeholder="Search by title or artist"
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '30px',
                  bgcolor: '#1A1A1A',
                  '& fieldset': { border: 'none' },
                  '&:hover fieldset': { border: 'none' },
                  '&.Mui-focused fieldset': { border: '1px solid white' },
                }
              }}
            />
            <TextField
              select
              label="Sort By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              SelectProps={{ native: true }}
              sx={{ 
                minWidth: 120,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  bgcolor: '#1A1A1A',
                  color: 'white',
                  '& fieldset': { border: 'none' }
                },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' }
              }}
            >
              <option value="title" style={{ backgroundColor: '#1A1A1A' }}>Title</option>
              <option value="artist" style={{ backgroundColor: '#1A1A1A' }}>Artist</option>
              <option value="genre" style={{ backgroundColor: '#1A1A1A' }}>Genre</option>
            </TextField>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            {genres.sort().map(genre => (
              <Chip
                key={genre}
                label={genre}
                onClick={() => setSelectedGenre(genre)}
                color={selectedGenre === genre ? "primary" : "default"}
                sx={{ 
                  borderRadius: '8px', 
                  px: 1,
                  fontWeight: selectedGenre === genre ? 700 : 400,
                  bgcolor: selectedGenre === genre ? 'primary.main' : 'rgba(255,255,255,0.1)',
                  color: selectedGenre === genre ? 'black' : 'white',
                  '&:hover': { bgcolor: selectedGenre === genre ? 'primary.main' : 'rgba(255,255,255,0.2)' }
                }}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: {
            xs: 'repeat(auto-fill, minmax(140px, 1fr))',
            sm: 'repeat(auto-fill, minmax(200px, 1fr))'
          }, 
          gap: { xs: 2, sm: 3 } 
        }}>
          {loading ? (
            Array.from(new Array(8)).map((_, index) => (
              <Box key={index} sx={{ height: { xs: 220, sm: 280 }, bgcolor: '#121212', borderRadius: 2, p: 2 }}>
                <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 1.5, mb: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
                <Skeleton variant="text" width="80%" sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                <Skeleton variant="text" width="60%" sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
                <Skeleton variant="rectangular" height={32} sx={{ borderRadius: '20px', bgcolor: 'rgba(255,255,255,0.05)' }} />
              </Box>
            ))
          ) : filteredSongs.map((song) => (
            <Card key={song.id} sx={{ 
              height: { xs: 230, sm: 280 }, 
              width: '100%',
              display: 'flex', 
              flexDirection: 'column',
              position: 'relative',
              bgcolor: '#121212',
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.05)',
              transition: 'all 0.3s ease',
              '&:hover': { bgcolor: '#1C1C1C' },
              '&:hover .play-overlay': { opacity: 1 }
            }}>
              <Box sx={{ position: 'relative', height: { xs: 130, sm: 180 }, p: { xs: 1, sm: 2 } }}>
                <Box
                  component="img"
                  src={song.image_url || `https://picsum.photos/seed/${song.title}/400/400`}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: 1.5,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                  }}
                />
                <Box 
                  className="play-overlay"
                  sx={{ 
                    position: 'absolute', 
                    top: 0, left: 0, right: 0, bottom: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    opacity: { xs: 1, sm: 0 },
                    transition: 'opacity 0.3s ease',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.4))'
                  }}
                >
                  <IconButton 
                    onClick={() => playSong(song)}
                    sx={{ 
                      bgcolor: 'primary.main', 
                      color: 'black',
                      width: { xs: 36, sm: 48 },
                      height: { xs: 36, sm: 48 },
                      boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                      '&:hover': { bgcolor: '#9575CD', transform: 'scale(1.05)' }
                    }}
                  >
                    <PlayArrowIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
                  </IconButton>
                </Box>
              </Box>
                <CardContent sx={{ flexGrow: 1, px: 2, py: 0, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      title={song.title}
                      sx={{ 
                        fontWeight: 700, 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flexGrow: 1,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}
                    >
                      {song.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 700, ml: 1, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                      ${song.price.toFixed(2)}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    title={song.artist}
                    sx={{ 
                      mb: { xs: 0.5, sm: 1.5 },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: { xs: '0.65rem', sm: '0.75rem' }
                    }}
                  >
                    {song.artist}
                  </Typography>
                <Button 
                  fullWidth 
                  variant={collectionIds.has(song.id) ? "text" : "contained"} 
                  size="small"
                  disabled={collectionIds.has(song.id)}
                  onClick={() => handlePurchase(song.id)}
                  startIcon={collectionIds.has(song.id) ? <CheckCircleIcon sx={{ fontSize: '1rem !important' }} /> : null}
                  sx={{ 
                    borderRadius: '20px', 
                    bgcolor: collectionIds.has(song.id) ? 'transparent' : 'primary.main',
                    color: collectionIds.has(song.id) ? 'primary.main' : 'black',
                    mt: 'auto',
                    mb: 1,
                    fontSize: { xs: '0.65rem', sm: '0.85rem' },
                    minHeight: { xs: 24, sm: 32 },
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { 
                      bgcolor: collectionIds.has(song.id) ? 'transparent' : '#9575CD',
                      transform: collectionIds.has(song.id) ? 'none' : 'scale(1.02)'
                    },
                    '&.Mui-disabled': {
                      color: 'primary.main',
                      opacity: 0.9
                    }
                  }}
                >
                  {collectionIds.has(song.id) ? 'Owned' : 'Buy Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );

};

export default Store;
