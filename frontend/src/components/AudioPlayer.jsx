import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { Box, Typography, IconButton, Slider, Stack, Paper } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import CloseIcon from '@mui/icons-material/Close';

const PlayerContext = createContext();

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(new Audio());

  const playSong = (song) => {
    if (currentSong?.id === song.id) {
      togglePlay();
      return;
    }
    setCurrentSong(song);
    // Use the same VITE_API_URL logic as the API client
    const apiBase = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:8000');
    audioRef.current.src = `${apiBase}/stream/${song.id}`;
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

  const stopPlayer = () => {
    audioRef.current.pause();
    audioRef.current.src = '';
    setCurrentSong(null);
    setIsPlaying(false);
  };

  return (
    <PlayerContext.Provider value={{ currentSong, isPlaying, playSong, togglePlay, stopPlayer }}>
      {children}
      <AudioPlayer audioRef={audioRef} />
    </PlayerContext.Provider>
  );
};

const AudioPlayer = ({ audioRef }) => {
  const { currentSong, isPlaying, togglePlay, stopPlayer } = usePlayer();
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(70);

  useEffect(() => {
    const audio = audioRef.current;
    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };
    audio.addEventListener('timeupdate', updateProgress);
    return () => audio.removeEventListener('timeupdate', updateProgress);
  }, []);

  const handleSeek = (e, newValue) => {
    const audio = audioRef.current;
    audio.currentTime = (newValue / 100) * audio.duration;
    setProgress(newValue);
  };

  const handleVolumeChange = (e, newValue) => {
    setVolume(newValue);
    audioRef.current.volume = newValue / 100;
  };

  if (!currentSong) return null;

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        height: 90, 
        bgcolor: '#0F0F0F', 
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        alignItems: 'center',
        px: 4,
        gap: 4,
        zIndex: 1100
      }}
    >
      <IconButton 
        size="small" 
        onClick={stopPlayer}
        sx={{ 
          position: 'absolute',
          top: 8,
          right: 8,
          color: 'white', 
          opacity: 0.5, 
          '&:hover': { opacity: 1, bgcolor: 'rgba(255,255,255,0.1)' } 
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>

      <Box sx={{ width: 300 }}>
        <Typography variant="subtitle1" noWrap sx={{ color: 'white', fontWeight: 700 }}>{currentSong.title}</Typography>
        <Typography variant="caption" noWrap sx={{ color: 'white', opacity: 0.6 }}>{currentSong.artist}</Typography>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={togglePlay} sx={{ bgcolor: 'white', color: 'black', '&:hover': { bgcolor: '#7E57C2' } }}>
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
        </Box>
        <Slider 
          size="small"
          value={progress}
          onChange={handleSeek}
          sx={{ width: '100%', mt: 1, color: '#7E57C2' }}
        />
      </Box>

      {/* Volume */}
      <Box sx={{ width: '30%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Stack spacing={2} direction="row" sx={{ width: 150 }} alignItems="center">
          <VolumeUpIcon size="small" sx={{ opacity: 0.6 }} />
          <Slider size="small" value={volume} onChange={handleVolumeChange} sx={{ color: '#b3b3b3' }} />
        </Stack>
      </Box>
    </Paper>
  );
};
