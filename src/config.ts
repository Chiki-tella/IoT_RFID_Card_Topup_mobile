// Configuration for different environments
const config = {
    getBackendUrl: () => {
        // For development, use your local IP or production URL
        // Change this to your actual backend URL
        return 'http://157.173.101.159:8208';
    },
};

export const BACKEND_URL = config.getBackendUrl();
