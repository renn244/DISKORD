// the backend address. set VITE_API_URL in frontend/.env when it isn't on localhost:5000
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
