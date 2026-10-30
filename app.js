import express, { static as expressStatic, urlencoded, json } from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import version1APi from './src/api/v1/index.js';
import { db } from './src/api/v1/config/mongodb.js';

const app = express();

// Security and standard middlewares
app.use(morgan('dev'));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/static', expressStatic('static'));
app.use(urlencoded({ extended: true }));
app.use(json());
app.use(compression());

// Initialize Database connection
db();

// Root welcome & health-check
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Task Management API is online and healthy',
        version: '1.0.0'
    });
});

// Mount routes on /api (assignment requirement) as well as /v1 and /api/v1
app.use('/api', version1APi);
app.use('/v1', version1APi);
app.use('/api/v1', version1APi);

// 404 Catch-All handler (Express 5 compatible, no naked wildcard)
app.use((req, res) => {
    res.status(404).json({
        success: false,
        status: false,
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
        error: 'NotFound'
    });
});

// Centralized Error Handling Middleware (Rule 4 & 6)
app.use((err, req, res, next) => {
    console.error('Unhandled Application Error:', err);
    const statusCode = err.status || err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    res.status(statusCode).json({
        success: false,
        status: false,
        message: err.message || 'Internal Server Error',
        error: isProduction ? 'InternalServerError' : (err.message || 'InternalServerError')
    });
});

export default app;
