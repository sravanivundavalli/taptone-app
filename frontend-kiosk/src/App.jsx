import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress, Container, Paper, ThemeProvider, createTheme, CssBaseline, Button, IconButton } from '@mui/material';
import { PlayArrow, Pause, SkipNext, SkipPrevious, VolumeUp, VolumeDown } from '@mui/icons-material';
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
  const [needsGesture, setNeedsGesture] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef(null);
  const playlistRef = useRef(null);
  const currentSongRef = useRef(null);

  useEffect(() => {
    let id = localStorage.getItem('kiosk_device_id');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('kiosk_device_id', id);
    }
    setDeviceId(id);
  }, []);

  useEffect(() => {
    if (deviceId && !needsGesture) {
      checkRegistration();
    }
  }, [deviceId, needsGesture]);

  const handleStart = () => {
    setNeedsGesture(false);
    if (audioRef.current) {
      audioRef.current.src = "data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
      audioRef.current.play()
        .then(() => {
          console.log("Audio engine unlocked");
          audioRef.current.pause();
        })
        .catch(e => console.error("Unlock failed", e));
    }
  };

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
    // Polling using recursive setTimeout to avoid closure traps
    const poll = async () => {
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
      setTimeout(poll, 1500);
    };
    poll();
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
      playlistRef.current = pl;
      if (pl.songs && pl.songs.length > 0) {
        playSong(pl.songs[0]);
      }
    } catch (err) {
      console.error('Playlist fetch error', err);
    }
  };

  const playSong = (song) => {
    setCurrentSong(song);
    currentSongRef.current = song;
    
    setTimeout(() => {
      if (audioRef.current) {
        const streamUrl = streamUrlBuilder(song.id);
        console.log("Loading stream:", streamUrl);
        
        audioRef.current.pause();
        audioRef.current.src = streamUrl;
        audioRef.current.load();
        
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Playback started");
              setIsPlaying(true);
            })
            .catch(e => {
              console.error("Playback failed", e);
              setIsPlaying(false);
            });
        }
      }
    }, 100);
  };

  const streamUrlBuilder = (id) => {
    const base = client.defaults.baseURL;
    return `${base}/stream/${id}`;
  };

  const togglePlay = () => {
    console.log("Toggle play requested. Audio paused state:", audioRef.current?.paused);
    if (!audioRef.current) return;
    
    if (audioRef.current.paused) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(e => console.error("Playback failed", e));
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const playNext = () => {
    const pl = playlistRef.current;
    const song = currentSongRef.current;
    console.log("Next track requested. Current pl:", !!pl, "Current song:", !!song);
    
    if (!pl || !song) return;
    const idx = pl.songs.findIndex(s => s.id === song.id);
    const nextIdx = (idx + 1) % pl.songs.length;
    playSong(pl.songs[nextIdx]);
  };

  const playPrev = () => {
    const pl = playlistRef.current;
    const song = currentSongRef.current;
    
    if (!pl || !song) return;
    const idx = pl.songs.findIndex(s => s.id === song.id);
    const prevIdx = (idx - 1 + pl.songs.length) % pl.songs.length;
    playSong(pl.songs[prevIdx]);
  };

  const adjustVolume = (delta) => {
    setVolume(prev => {
      const newVol = Math.max(0, Math.min(1, prev + (delta * 0.05)));
      if (audioRef.current) audioRef.current.volume = newVol;
      return newVol;
    });
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setCurrentTime(cur);
      setDuration(dur || 0);
      const p = (cur / dur) * 100;
      setProgress(p || 0);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEnded = () => {
    playNext();
  };

  if (needsGesture) {
    return (
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center', 
          bgcolor: 'black',
          color: 'white',
          p: 4,
          textAlign: 'center'
        }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, letterSpacing: 2 }}>TAPTONE</Typography>
          <Button 
            variant="contained" 
            size="large" 
            onClick={handleStart}
            sx={{ py: 2, px: 6, borderRadius: 4, fontWeight: 'bold', mt: 2 }}
          >
            START
          </Button>
          <audio ref={audioRef} />
        </Box>
      </ThemeProvider>
    );
  }

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

        <Container maxWidth={false} sx={{ zIndex: 1, height: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', py: 2, gap: 4, px: 4 }}>
          {currentSong ? (
            <>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Box 
                  component="img" 
                  src={currentSong.image_url} 
                  sx={{ width: 140, height: 140, borderRadius: 3, mb: 1, boxShadow: '0 10px 20px rgba(0,0,0,0.8)' }} 
                />
                <Typography variant="body1" sx={{ fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {currentSong.title}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.6, display: 'block', mb: 1 }}>
                  {currentSong.artist}
                </Typography>

                <Box sx={{ width: '100%', height: 4, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, mb: 0.5, position: 'relative' }}>
                  <Box sx={{ width: `${progress}%`, height: '100%', bgcolor: 'primary.main', borderRadius: 2, transition: 'width 0.2s linear' }} />
                </Box>
                <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: 0.5, fontSize: '0.6rem', textAlign: 'right', fontWeight: 700 }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, bgcolor: 'rgba(255,255,255,0.05)', px: 0.5, py: 0.2, borderRadius: 2 }}>
                      <IconButton size="small" onClick={playPrev} sx={{ color: 'white', opacity: 0.7 }}>
                        <SkipPrevious sx={{ fontSize: '1.2rem' }} />
                      </IconButton>
                      <IconButton size="small" onClick={togglePlay} sx={{ color: 'primary.main' }}>
                        {isPlaying ? <Pause sx={{ fontSize: '1.5rem' }} /> : <PlayArrow sx={{ fontSize: '1.5rem', color: 'white' }} />}
                      </IconButton>
                      <IconButton size="small" onClick={playNext} sx={{ color: 'white', opacity: 0.7 }}>
                        <SkipNext sx={{ fontSize: '1.2rem' }} />
                      </IconButton>
                   </Box>
                   
                   <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.1)', px: 1, py: 0.5, borderRadius: 1, gap: 0.5 }}>
                      <IconButton size="small" onClick={() => adjustVolume(-1)} sx={{ p: 0, color: 'white', opacity: 0.6 }}>
                        <VolumeDown sx={{ fontSize: '1rem' }} />
                      </IconButton>
                      <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.6rem', minWidth: '25px', textAlign: 'center' }}>
                         {Math.round(volume * 100)}%
                      </Typography>
                      <IconButton size="small" onClick={() => adjustVolume(1)} sx={{ p: 0, color: 'white', opacity: 0.6 }}>
                        <VolumeUp sx={{ fontSize: '1rem' }} />
                      </IconButton>
                   </Box>
                </Box>
              </Box>

              <Box sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                {playlist && (
                  <Box sx={{ bgcolor: 'rgba(0,0,0,0.4)', p: 1.5, borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography variant="caption" sx={{ display: 'block', mb: 1, opacity: 0.5, fontWeight: 800, letterSpacing: 1 }}>UP NEXT</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {playlist.songs.map((song, idx) => {
                        const isCurrent = song.id === currentSong.id;
                        return (
                          <Typography key={song.id} variant="caption" sx={{ 
                            opacity: isCurrent ? 1 : 0.4,
                            fontWeight: isCurrent ? 800 : 400,
                            color: isCurrent ? 'primary.main' : 'inherit',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            <span style={{ minWidth: '12px' }}>{idx + 1}.</span> {song.title}
                          </Typography>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </Box>
              <audio 
                ref={audioRef} 
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
              />
            </>
          ) : (
            <Box sx={{ width: '100%', textAlign: 'center', opacity: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 2 }}>TAPTONE</Typography>
              <Typography variant="body2">Waiting for interaction...</Typography>
              <audio ref={audioRef} />
            </Box>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
};

export default App;
