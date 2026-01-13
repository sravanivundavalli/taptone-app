import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Container, Paper, ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import client from './api/client';
import { v4 as uuidv4 } from 'uuid';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#7E57C2' },
    background: { default: '#000000', paper: '#0F0F0F' }
  },
  typography: {
    fontFamily: '"Roboto", sans-serif',
  }
});

const App = () => {
  const [deviceId, setDeviceId] = useState(localStorage.getItem('kiosk_device_id'));
  const [device, setDevice] = useState(null);
  const [claimCode, setClaimCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playlist, setPlaylist] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef(new Audio());

  useEffect(() => {
    let id = localStorage.getItem('kiosk_device_id');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('kiosk_device_id', id);
    }
    setDeviceId(id);
  }, []);

  useEffect(() => {
    if (deviceId) {
      checkRegistration();
    }
  }, [deviceId]);

  const checkRegistration = async () => {
    try {
      const res = await client.post(`/api/v1/devices/register?device_id=${deviceId}`);
      const dev = res.data;
      setDevice(dev);
      if (!dev.account_id) {
        requestClaimCode();
      } else {
        setLoading(false);
        startPolling();
      }
    } catch (err) {
      console.error('Registration error', err);
      setTimeout(checkRegistration, 5000);
    }
  };

  const requestClaimCode = async () => {
    try {
      const res = await client.post(`/api/v1/devices/claim-request?device_id=${deviceId}`);
      setClaimCode(res.data.code);
      setLoading(false);
      
      const interval = setInterval(async () => {
        try {
          const check = await client.get(`/api/v1/devices/me?device_id=${deviceId}`);
          if (check.data.account_id) {
            clearInterval(interval);
            setDevice(check.data);
            setClaimCode(null);
            startPolling();
          }
        } catch (e) {
          // Still waiting
        }
      }, 3000);
    } catch (err) {
      console.error('Claim request error', err);
      setTimeout(requestClaimCode, 5000);
    }
  };

  const startPolling = () => {
    setInterval(async () => {
      try {
        await client.post(`/api/v1/devices/heartbeat?device_id=${deviceId}`);
        const res = await client.get(`/api/v1/devices/${deviceId}/commands`);
        const commands = res.data;
        for (const cmd of commands) {
          await handleCommand(cmd);
          await client.post(`/api/v1/devices/commands/${cmd.id}/ack`);
        }
      } catch (err) {
        console.error('Polling error', err);
      }
    }, 1500);
  };

  const handleCommand = async (cmd) => {
    const payload = cmd.payload ? JSON.parse(cmd.payload) : {};
    console.log('Executing command:', cmd.command_type, payload);
    switch (cmd.command_type) {
      case 'LOAD_PLAYLIST':
        await fetchPlaylist(payload.playlist_id);
        break;
      case 'PLAY_PAUSE':
        togglePlay();
        break;
      case 'NEXT':
        playNext();
        break;
      case 'PREV':
        playPrev();
        break;
      case 'VOLUME_DELTA':
        adjustVolume(payload.delta);
        break;
      default:
        break;
    }
  };

  const fetchPlaylist = async (id) => {
    try {
      const res = await client.get(`/playlists/${id}`);
      const pl = res.data;
      setPlaylist(pl);
      if (pl.songs && pl.songs.length > 0) {
        playSong(pl.songs[0]);
      }
    } catch (err) {
      console.error('Playlist fetch error', err);
    }
  };

  const playSong = (song) => {
    setCurrentSong(song);
    audioRef.current.src = `${client.defaults.baseURL}/stream/${song.id}`;
    audioRef.current.play();
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (!playlist || !currentSong) return;
    const idx = playlist.songs.findIndex(s => s.id === currentSong.id);
    const nextIdx = (idx + 1) % playlist.songs.length;
    playSong(playlist.songs[nextIdx]);
  };

  const playPrev = () => {
    if (!playlist || !currentSong) return;
    const idx = playlist.songs.findIndex(s => s.id === currentSong.id);
    const prevIdx = (idx - 1 + playlist.songs.length) % playlist.songs.length;
    playSong(playlist.songs[prevIdx]);
  };

  const adjustVolume = (delta) => {
    setVolume(prev => {
      const newVol = Math.max(0, Math.min(1, prev + (delta * 0.05)));
      audioRef.current.volume = newVol;
      return newVol;
    });
  };

  if (loading) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'black' }}>
          <CircularProgress color="primary" />
        </Box>
      </ThemeProvider>
    );
  }

  if (claimCode) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ textAlign: 'center', pt: 10, bgcolor: 'black', height: '100vh', color: 'white' }}>
          <Typography variant="h4" gutterBottom>Register Device</Typography>
          <Typography variant="body1" sx={{ opacity: 0.7, mb: 4 }}>Enter this code in your TapTone web app:</Typography>
          <Paper sx={{ display: 'inline-block', p: 3, bgcolor: '#1A1A1A', borderRadius: 4 }}>
            <Typography variant="h2" sx={{ fontWeight: 900, letterSpacing: 8, color: 'primary.main' }}>{claimCode}</Typography>
          </Paper>
          <Typography variant="caption" sx={{ display: 'block', mt: 4, opacity: 0.5 }}>DEVICE ID: {deviceId}</Typography>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ 
        height: '100vh', 
        bgcolor: 'black', 
        color: 'white', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {currentSong && (
          <Box sx={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `url(${currentSong.image_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(60px) brightness(0.2)',
            zIndex: 0,
            transition: 'background-image 0.5s ease'
          }} />
        )}

        <Container maxWidth="xs" sx={{ zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 4 }}>
          {currentSong ? (
            <Box sx={{ textAlign: 'center' }}>
              <Box 
                component="img" 
                src={currentSong.image_url} 
                sx={{ width: 180, height: 180, borderRadius: 4, mb: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.8)' }} 
              />
              <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentSong.title}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.6, mb: 4 }}>
                {currentSong.artist}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                 <Typography variant="caption" sx={{ bgcolor: 'rgba(255,255,255,0.1)', px: 2, py: 1, borderRadius: 2, fontWeight: 700 }}>
                    {isPlaying ? 'PLAYING' : 'PAUSED'}
                 </Typography>
                 <Typography variant="caption" sx={{ bgcolor: 'rgba(255,255,255,0.1)', px: 2, py: 1, borderRadius: 2, fontWeight: 700 }}>
                    VOL: {Math.round(volume * 100)}%
                 </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', opacity: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>TAPTONE KIOSK</Typography>
              <Typography variant="body2">Waiting for interaction...</Typography>
            </Box>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
