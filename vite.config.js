import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import process from 'process'; // Import the 'process' module

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    base: process.env.NODE_ENV === 'production' ? 'notouchyourface' : './',
    server: {
        open: true,
        port: 3000,
    },
});
