import React, { useState, useEffect } from 'react';
import { Alert, Box, Button, CircularProgress, Divider, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { Visibility, VisibilityOff, Login as LoginIcon, Event as EventIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { config } from '../config/env';
import BrandPanel from './auth/BrandPanel';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if we came from registration with a success message
    if (location.state?.message) {
      setSuccess(location.state.message);
      if (location.state?.email) {
        setEmail(location.state.email);
      }
      // Clear the state to prevent showing message on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/'); // Redirect to home page after successful login
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.status === 401) {
        setError('Invalid email or password');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to backend Google Auth endpoint
    window.location.href = `${config.apiBaseUrl}/auth/google`;
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { lg: '1fr 1fr' }, bgcolor: 'background.default' }}>
      <BrandPanel />

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 6 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          {/* Mobile brand mark (BrandPanel covers desktop) */}
          <Box sx={{ display: { lg: 'none' }, alignItems: 'center', gap: 1.5, mb: 5 }}>
            <Box
              sx={{
                display: 'grid',
                placeItems: 'center',
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'white',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
              }}
            >
              <EventIcon sx={{ fontSize: 19 }} />
            </Box>
            <Typography variant="h6" fontWeight={700}>
              Event Management
            </Typography>
          </Box>

          <Typography variant="h3" component="h1" mb={0.5}>
            Welcome back
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={4}>
            Sign in to your admin account
          </Typography>

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              id="email"
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="Enter your email"
              sx={{ mb: 2.5 }}
            />
            <TextField
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isSubmitting}
              placeholder="Enter your password"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((s) => !s)}
                        edge="end"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting || !email || !password}
              startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <LoginIcon />}
              sx={{ mt: 3 }}
            >
              {isSubmitting ? 'Logging in…' : 'Login'}
            </Button>
          </Box>

          <Divider sx={{ my: 3.5 }}>
            <Typography variant="caption" color="text.secondary">
              OR
            </Typography>
          </Divider>

          <Button
            onClick={handleGoogleLogin}
            variant="outlined"
            size="large"
            fullWidth
            disabled={isSubmitting}
            type="button"
            sx={{ bgcolor: 'background.paper' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 10 }}>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
