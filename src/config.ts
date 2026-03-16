// Configuration for different environments
const config = {
    getBackendUrl: () => {
        // For tablet/physical device testing, use your machine's IP
        // Your machine IP: 192.168.56.1
        // Make sure tablet is on the same network
        return 'http://192.168.56.1:8275';
    },
};

export const BACKEND_URL = config.getBackendUrl();
