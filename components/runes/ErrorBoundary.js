import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';

class RuneErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console (and could also log to an error reporting service)
    console.error('Rune system error:', error, errorInfo);

    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <Box
          sx={{
            p: 3,
            border: '1px solid',
            borderColor: 'error.main',
            borderRadius: 1,
            bgcolor: 'error.light',
            color: 'error.contrastText',
          }}
          role="alert"
          aria-live="assertive"
        >
          <Typography variant="h6" component="h2" gutterBottom>
            Rune System Error
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Something went wrong while loading the rune information. This might
            be due to network issues or corrupted data.
          </Typography>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                component="pre"
                sx={{ whiteSpace: 'pre-wrap', fontSize: '0.75rem' }}
              >
                {this.state.error.toString()}
                {this.state.errorInfo.componentStack}
              </Typography>
            </Alert>
          )}

          <Button
            variant="contained"
            color="primary"
            onClick={this.handleRetry}
            aria-label="Retry loading rune system"
          >
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default RuneErrorBoundary;
