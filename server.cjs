    // This line must be at the very top to affect Node.js's outgoing HTTPS requests.
    // Temporarily disables SSL certificate validation for Node.js when making outgoing HTTPS requests.
    // This is generally NOT recommended for production environments due to security implications,
    // but can be useful for debugging connectivity with self-signed certificates or specific environments.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

    // Required Node.js modules for the Express server and proxy logic
    const express = require('express');
    const http = require('follow-redirects').http; // Handles HTTP requests with redirects
    const https = require('follow-redirects').https; // Handles HTTPS requests with redirects
    const url = require('url'); // Required for parsing URLs
    const cors = require('cors'); // Middleware for Cross-Origin Resource Sharing
    const bodyParser = require('body-parser'); // Middleware for parsing request bodies

    // Initialize the Express application
    const app = express();

    // CORS configuration to allow requests from your Firebase-hosted frontend.
    // This explicitly allows your React application (the origin) to make requests to this proxy.
    const corsOptions = {
        // REPLACE THIS WITH YOUR ACTUAL FIREBASE HOSTING URL.
        // It must exactly match the domain where your React app is deployed.
        origin: 'https://rich-landscapes-sp-audit.web.app', // Your confirmed Firebase Hosting URL
        methods: ['GET', 'POST', 'OPTIONS'], // Allowed HTTP methods for cross-origin requests
        allowedHeaders: ['Content-Type'], // Allowed request headers
        credentials: true, // Allows cookies and HTTP authentication credentials to be sent (if applicable)
    };
    app.use(cors(corsOptions)); // Apply the CORS middleware to the Express app

    // Body parser middleware for handling incoming request bodies.
    // Must be placed before any route handlers that need to access `req.body`.
    app.use(bodyParser.json({ limit: '50mb' })); // Parses JSON-encoded bodies, with a generous size limit for image data
    app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' })); // Parses URL-encoded bodies


    // --- DEBUG: Raw Request Logger ---
    // This middleware logs basic information about every incoming request to Express.
    // It's useful for verifying that requests are actually reaching this proxy server.
    app.use((req, res, next) => {
        console.log(`\n--- [DEBUG RAW RECEIVE] ${req.method} ${req.url} received at ${new Date().toISOString()} ---`);
        next(); // Pass control to the next middleware/route handler
    });
    // --- END DEBUG ---


    const PORT = process.env.PORT || 55555; // Use Render's assigned port or default to 55555 locally

    // --- IMPORTANT: Replace with your actual Google Apps Script Web App URL ---
    // This is the target URL where the proxy will forward requests to.
    // Ensure this is the *Deployment Executable URL* from your Apps Script project.
    const SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbyv8MltKTrxQfypLA2FmmYbCWgx5lpK8zFFwq1xdlX41JJY6n0KHHOJlM5Dygb59mjM/exec'; // Your Google Apps Script Web App URL


    // --- Custom Proxy Logic for /api Route ---
    // This `app.all('/api', ...)` middleware will handle all HTTP methods (GET, POST, OPTIONS, etc.)
    // that target a path starting with `/api`.
    app.all('/api', (req, expressRes) => { // `expressRes` is the response object for the client (browser)
        console.log(`\n--- [PROXY] Forwarding ${req.method} request to Google Apps Script at ${new Date().toISOString()} ---`);
        
        // Parse the target Google Apps Script URL to get hostname, port, and path details
        const parsedUrl = url.parse(SCRIPT_WEB_APP_URL);

        // Determine which protocol handler to use (http or https)
        const protocol = parsedUrl.protocol === 'https:' ? https : http;

        // Prepare options for the outgoing HTTPS request to Google Apps Script
        const options = {
            hostname: parsedUrl.hostname, // e.g., 'script.google.com'
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80), // Use port from URL or default
            path: parsedUrl.path, // The base path of your Apps Script Web App
            method: req.method, // Use the same HTTP method as the incoming request (GET, POST, OPTIONS)
            headers: {
                // Forward relevant headers from the original request to the Apps Script
                'Content-Type': req.headers['content-type'] || 'application/json', // Use original content-type or default
                'User-Agent': req.headers['user-agent'] || 'Node.js-Proxy', // Use original user-agent or a default
                'Accept': req.headers['accept'] || '*/*', // Use original accept header or default
                'Host': parsedUrl.hostname, // IMPORTANT: Set Host header to the target's hostname
                // No need for 'origin' header here, as it's an internal server-to-server request
            },
            rejectUnauthorized: false // Matches process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0' for outgoing request
            // `follow-redirects` handles `maxRedirects` internally
        };

        console.log('[PROXY] Outgoing Request Options:', options);
        
        // For POST or PUT requests, prepare the incoming request body to be forwarded.
        let bodyData = '';
        if (req.method === 'POST' || req.method === 'PUT') {
            if (req.body) {
                bodyData = JSON.stringify(req.body);
                console.log('[PROXY] Outgoing Request Body (parsed by Express):', bodyData.substring(0, 500) + (bodyData.length > 500 ? '...' : '')); // Log truncated body
                // Manually set Content-Length for the outgoing request if there's a body
                options.headers['Content-Length'] = Buffer.byteLength(bodyData);
            }
        }

        // Create the outgoing request to the Google Apps Script using follow-redirects
        const proxyReq = protocol.request(options, (proxyRes) => { // `proxyRes` is the response from Apps Script (after redirects)
            console.log(`[PROXY] Final Response from Apps Script - STATUS: ${proxyRes.statusCode}`);
            console.log('[PROXY] Final Response Headers:', proxyRes.headers);

            // Forward headers from the Apps Script final response back to the client (browser)
            for (const header in proxyRes.headers) {
                // Skip problematic or auto-generated headers to prevent conflicts
                if (header.toLowerCase() === 'content-length' || 
                    header.toLowerCase() === 'transfer-encoding' || 
                    header.toLowerCase().startsWith('x-')) {
                    continue; 
                }
                expressRes.setHeader(header, proxyRes.headers[header]);
            }
            
            // Set the status code for the response sent back to the browser
            expressRes.writeHead(proxyRes.statusCode, proxyRes.statusMessage);

            // Stream the Apps Script response body back to the browser
            proxyRes.pipe(expressRes);
        });

        // Handle errors during the outgoing request to Apps Script
        proxyReq.on('error', (e) => {
            console.error(`[PROXY ERROR] Failed to connect/redirect to Apps Script: ${e.code || 'UNKNOWN'}: ${e.message}`);
            // If no response headers have been sent yet, send a 500 Internal Server Error to the client
            if (!expressRes.headersSent) {
                expressRes.writeHead(500, { 'Content-Type': 'application/json' });
                expressRes.end(JSON.stringify({ success: false, message: `Proxy Error: Failed to connect to Google Apps Script. Details: ${e.message}` }));
            }
        });

        // Write the body data for POST/PUT requests
        if (bodyData) {
            proxyReq.write(bodyData);
        }

        // End the outgoing request to Apps Script (sends the request)
        proxyReq.end();
    });

    // Basic root route for the proxy server itself.
    // Accessing the proxy's base URL (e.g., https://your-proxy.onrender.com/) will show this message.
    app.get('/', (req, res) => {
        res.send('Proxy server is running!');
    });

    // Start the Express server, listening on the specified PORT.
    // '0.0.0.0' makes the server listen on all available network interfaces.
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Proxy server listening at http://localhost:${PORT}`);
        // Note: The below IP is specific to your local network setup and may not be universally accurate.
        console.log(`Accessible on your local network at http://192.168.1.97:${PORT}`);
        console.log(`Forwarding requests for /api to ${SCRIPT_WEB_APP_URL}`);
    });
    