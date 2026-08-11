// Centralized API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export const API_URL = `${API_BASE_URL}/api`;
export const WS_URL = API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://');
