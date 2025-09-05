// Environment configuration for the React frontend
// All environment variables must start with REACT_APP_ to be accessible

export const config = {
  // API Configuration
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || (
    // In production, backend runs on same host but port 5001
    window.location.hostname !== 'localhost' 
      ? `http://${window.location.hostname}:5001`
      : 'http://localhost:5001'
  ),
  
  // App Configuration  
  appName: process.env.REACT_APP_APP_NAME || 'RBAC Identity System',
  version: process.env.REACT_APP_VERSION || '1.0.0',
  environment: process.env.REACT_APP_ENVIRONMENT || 'development',
  
  // Feature Flags
  enableDebug: process.env.REACT_APP_ENABLE_DEBUG === 'true',
  enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
  
  // Computed values
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// Helper function to log configuration in development
export const logConfig = () => {
  if (config.enableDebug && config.isDevelopment) {
    console.group('🔧 App Configuration');
    console.log('API Base URL:', config.apiBaseUrl);
    console.log('Environment:', config.environment);
    console.log('Debug Mode:', config.enableDebug);
    console.log('Analytics:', config.enableAnalytics);
    console.groupEnd();
  }
};

// Validate required environment variables
export const validateConfig = () => {
  const requiredVars = ['apiBaseUrl'];
  const missing = requiredVars.filter(key => !config[key as keyof typeof config]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
