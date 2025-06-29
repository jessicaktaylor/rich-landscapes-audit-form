// This line must be at the very top to affect Node.js's outgoing HTTPS requests.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Temporarily disable SSL certificate validation for Node.js
const express = require('express');
const http = require('follow-redirects').http; // Use follow-redirects's http
const https = require('follow-redirects').https; // Use follow-redirects's https
const url = require('url');     // Required for parsing URLs
const cors = require('cors');
const bodyParser = require('body-parser'); 

const app = express();

    // ... (Your existing 'require' statements and other code above this point) ...
    // Make sure 'const cors = require('cors');' is present near the top.

    // CORS configuration to allow requests from your Firebase-hosted frontend
    // Replace 'https://your-firebase-hosting-url.web.app' with your ACTUAL Firebase Hosting URL
    const corsOptions = {
        origin: 'https://skatepark-audit-form.web.app', // <--- THIS IS YOUR FIREBASE HOSTING URL
        methods: ['GET', 'POST', 'OPTIONS'], // Allow these HTTP methods
        allowedHeaders: ['Content-Type'], // Allow the Content-Type header
        credentials: true, // Allow sending cookies/auth headers (if applicable, though not used now)
    };
    app.use(cors(corsOptions)); // Apply the CORS middleware to Express app

    // Your existing body-parser middleware should be here, just after CORS
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

    // ... (The rest of your server.cjs file, including app.all('/api', ...) and app.listen(...)) ...
    

// --- DEBUG: Raw Request Logger ---
// This middleware logs every incoming request to Express immediately.
// It helps verify that requests are reaching the Express server at all.
app.use((req, res, next) => {
    console.log(`\n--- [DEBUG RAW RECEIVE] ${req.method} ${req.url} received at ${new Date().toISOString()} ---`);
    next(); // Pass control to the next middleware in the chain
});
// --- END DEBUG ---

const PORT = 55555; // Port for your Node.js proxy server

// --- IMPORTANT: Replace with your actual Google Apps Script Web App URL ---
// This is the target URL where the proxy will forward requests.
const SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyv8MltKTrxQfypLA2FmmYbCWgx5lpK8zFFwq1xdlX41JJY6n0KHHOJlM5Dygb59mjM/exec'; // Your Google Apps Script URL

// Configure body parsers. These are global Express middlewares that
// process the incoming request body (e.g., JSON payloads from your React app).
// They must be applied *before* any route handlers that need to access `req.body`.
app.use(express.json({ limit: '50mb' })); // Parses JSON bodies
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Parses URL-encoded bodies (for form data)

// Configure CORS (Cross-Origin Resource Sharing). This global middleware allows
// your React frontend (running on a different port/origin, e.g., localhost:5173)
// to make requests to your Node.js proxy server (e.g., localhost:55555).
// Without this, web browsers block cross-origin requests.
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests from any localhost origin during development
        // (e.g., http://localhost:5173, http://localhost:3000, etc.).
        if (!origin || origin.startsWith('http://localhost:')) {
            callback(null, true); // Allow the request
        } else {
            // For any other origins (e.g., deployed websites), deny the request for security.
            callback(new Error('Not allowed by CORS policy'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Explicitly allow these HTTP methods, including OPTIONS for preflight
    credentials: true // Allow sending cookies and HTTP authentication credentials (if applicable)
}));

// --- Custom Proxy Logic for /api Route ---
// This `app.all('/api', ...)` middleware will handle all HTTP methods (GET, POST, OPTIONS)
// that target a path starting with `/api`.
app.all('/api', (req, expressRes) => { // `expressRes` is the response object for the client (browser)
    console.log(`\n--- [DEBUG CUSTOM PROXY] Received ${req.method} request to /api at ${new Date().toISOString()} ---`);
    
    // Parse the target Google Apps Script URL to get hostname, port, and path details
    const parsedUrl = url.parse(SCRIPT_WEB_APP_URL);

    // Prepare options for the outgoing HTTPS request to Google Apps Script
    const options = {
        hostname: parsedUrl.hostname, // e.g., 'script.google.com'
        port: 443, // Standard HTTPS port
        path: parsedUrl.path, // The base path of your Apps Script Web App
        method: req.method, // Use the same HTTP method as the incoming request (GET, POST, OPTIONS)
        headers: {
            // Forward relevant headers from the original request to the Apps Script
            'Content-Type': req.headers['content-type'] || 'application/json', // Use original content-type or default
            'User-Agent': req.headers['user-agent'] || 'Node.js-Proxy', // Use original user-agent or a default
            'Accept': req.headers['accept'] || '*/*', // Use original accept header or default
            'Host': parsedUrl.hostname // IMPORTANT: Set Host header to the target's hostname
        },
        rejectUnauthorized: false // Matches process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0' for outgoing request
        // `follow-redirects` handles `maxRedirects` internally
    };

    console.log('[CUSTOM PROXY] Outgoing Request Options:', options);
    // Log the request body if it's a POST or PUT request for debugging purposes
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('[CUSTOM PROXY] Outgoing Request Body (parsed by Express):', JSON.stringify(req.body));
    }

    // Create the outgoing HTTPS request to the Google Apps Script using follow-redirects's https
    const proxyReq = https.request(options, (proxyRes) => { // `proxyRes` is the response from Apps Script (after redirects)
        console.log(`[CUSTOM PROXY] Final Response from Apps Script - STATUS: ${proxyRes.statusCode}`);
        console.log('[CUSTOM PROXY] Final Response Headers:', proxyRes.headers);

        // Forward headers from the Apps Script final response back to the client (browser)
        for (const header in proxyRes.headers) {
            // Avoid issues with `content-length` if the response is chunked or if it's a redirect that has been followed.
            // Also, some headers might be added by `follow-redirects` that shouldn't be passed directly.
            if (header.toLowerCase() === 'content-length' || header.toLowerCase() === 'transfer-encoding' || header.toLowerCase().startsWith('x-')) {
                continue; // Skip these for cleaner pass-through
            }
            expressRes.setHeader(header, proxyRes.headers[header]);
        }
        
        // Ensure CORS headers are passed back to the browser for the final response
        expressRes.setHeader('Access-Control-Allow-Origin', '*'); // Reconfirm for safety
        expressRes.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        expressRes.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');


        // Set the status code for the response sent back to the browser
        expressRes.writeHead(proxyRes.statusCode, proxyRes.statusMessage);

        // Stream the Apps Script response body back to the browser
        proxyRes.pipe(expressRes);
    });

    // Handle errors during the outgoing request to Apps Script
    proxyReq.on('error', (e) => {
        console.error(`[CUSTOM PROXY ERROR] Failed to connect/redirect to Apps Script: ${e.code || 'UNKNOWN'}: ${e.message}`);
        // If no response headers have been sent yet, send a 500 Internal Server Error to the client
        if (!expressRes.headersSent) {
            expressRes.writeHead(500, { 'Content-Type': 'application/json' });
            expressRes.end(JSON.stringify({ success: false, message: `Proxy Error: ${e.message}` }));
        }
    });

    // For POST or PUT requests, write the incoming request body (parsed by Express)
    // to the outgoing proxy request to Apps Script.
    if (req.method === 'POST' || req.method === 'PUT') {
        if (req.body) {
            const bodyData = JSON.stringify(req.body);
            // Manually set Content-Length for the outgoing request
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData)); 
            proxyReq.write(bodyData);
        }
    }

    // End the outgoing request to Apps Script (sends the request)
    proxyReq.end();
});

// Basic root route for the proxy server itself.
// Accessing http://localhost:55555/ will show this message.
app.get('/', (req, res) => {
    res.send('Proxy server is running!');
});

    // ... (rest of your server.cjs code remains unchanged above this point) ...

    app.listen(PORT, '0.0.0.0', () => { // Listen on all network interfaces
        console.log(`Proxy server listening at http://localhost:${PORT}`);
        console.log(`Accessible on your network at http://192.168.1.97:${PORT}`); // Using your confirmed IP for clarity
        console.log(`Forwarding requests for /api to ${SCRIPT_WEB_APP_URL}`);
    });
