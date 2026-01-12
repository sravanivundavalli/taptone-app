import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7E57C2', // Royal Amethyst (Muted Purple)
    },
    secondary: {
      main: '#9575CD', // Muted Purple Accent
    },
    background: {
      default: '#000000',
      paper: '#0F0F0F',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          textTransform: 'none',
          fontWeight: 700,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#0F0F0F',
          borderRadius: 8,
          transition: 'background-color 0.3s ease',
          '&:hover': {
            backgroundColor: '#1A1A1A',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#000000',
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: 'none',
        },
      },
    },
  },
});

export default theme;
