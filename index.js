///      ॐ 卐 ॐ      ॐ 卐 ॐ      ॐ 卐 ॐ      श्री गणेश      ॐ 卐 ॐ      ॐ 卐 ॐ      ॐ 卐 ॐ      ///

import { createServer } from 'http';
import { config } from 'dotenv';
import app from './app.js';


config();

const server = createServer(app);
const port = process.env.APPID || process.env.PORT || 8000;

// Initialize Socket.IO

// Initialize Firebase Admin (optional until credentials provided)

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use.`);
    } else {
        console.error('Server error:', err);
    }
});

server.listen(port, () => {
    console.log(`Backend running on port ${port}`);
});
