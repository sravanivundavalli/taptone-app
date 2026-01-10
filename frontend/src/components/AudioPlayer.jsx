import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { Box, Typography, IconButton, Slider, Stack, Paper } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';

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
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
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

  return (
    <PlayerContext.Provider value={{ currentSong, isPlaying, playSong, togglePlay }}>
      {children}
      <AudioPlayer audioRef={audioRef} />
    </PlayerContext.Provider>
  );
};

const AudioPlayer = ({ audioRef }) => {
  const { currentSong, isPlaying, togglePlay } = usePlayer();
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
        bgcolor: '#181818', 
        borderTop: '1px solid rgba(255,255,255,0.1)',
        px: 3,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
      elevation={10}
    >
      {/* Song Info */}
      <Box sx={{ width: '30%', display: 'flex', alignItems: 'center' }}>
        <Box sx={{ ml: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 700 }}>{currentSong.title}</Typography>
          <Typography variant="body2" color="textSecondary">{currentSong.artist}</Typography>
        </Box>
      </Box>

      {/* Controls */}
      <Box sx={{ width: '40%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton size="small"><SkipPreviousIcon /></IconButton>
          <IconButton onClick={togglePlay} sx={{ bgcolor: 'white', color: 'black', '&:hover': { bgcolor: '#1DB954' } }}>
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
          <IconButton size="small"><SkipNextIcon /></IconButton>
        </Stack>
        <Slider
          size="small"
          value={progress}
          onChange={handleSeek}
          sx={{ width: '100%', mt: 1, color: '#1DB954' }}
        />
      </Box>

      {/* Volume */}
      <Box sx={{ width: '30%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Stack spacing={2} direction="row" sx={{ width: 150 }} alignItems="center">
          <VolumeUpIcon size="small" />
          <Slider size="small" value={volume} onChange={handleVolumeChange} sx={{ color: '#b3b3b3' }} />
        </Stack>
      </Box>
    </Paper>
  );
};
