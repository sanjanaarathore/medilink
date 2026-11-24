/**
 * @file server.js
 * @description Production-grade offline local HTTP deployment server for MediLink Offline.
 * Pure Node.js implementation: zero external dependencies, fast static asset delivery,
 * client-side SPA routing fallback, PWA Service Worker support, and proper MIME types.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  // CORS & Security headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse path
  const parsedUrl = new URL(req.url, `http://${HOST}:${PORT}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Normalize path
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Determine potential file locations
  const potentialPaths = [
    path.join(__dirname, 'public', pathname),
    path.join(__dirname, pathname),
    path.join(__dirname, 'public/dist', pathname)
  ];

  let filePath = null;
  for (const p of potentialPaths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      filePath = p;
      break;
    }
  }

  // SPA Fallback: If not an asset request (e.g. navigation /phc, /hospital, /admin), serve index.html
  if (!filePath) {
    const ext = path.extname(pathname);
    if (!ext || ext === '.html') {
      filePath = path.join(__dirname, 'index.html');
      if (!fs.existsSync(filePath)) {
        filePath = path.join(__dirname, 'public/index.html');
      }
    }
  }

  if (filePath && fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Service Worker should not be cached aggressively
    if (pathname === '/sw.js') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else if (ext === '.html') {
      res.setHeader('Cache-Control', 'no-cache');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  } else {
    // 404 Not Found
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found: MediLink Offline');
  }
});

server.listen(PORT, HOST, () => {
  console.log('====================================================');
  console.log('   MediLink Offline — Local Deployment Server');
  console.log('====================================================');
  console.log(`\n  Local Workstation URL: http://${HOST}:${PORT}`);
  console.log(`  Network Air-Gap Node:  http://127.0.0.1:${PORT}`);
  console.log('\n  Active Role-Based Portals:');
  console.log(`  - 1. Admin Portal:           http://${HOST}:${PORT}/admin`);
  console.log(`  - 2. PHC Clinical Portal:    http://${HOST}:${PORT}/phc`);
  console.log(`  - 3. Hospital Intake Portal: http://${HOST}:${PORT}/hospital`);
  console.log('\n  PWA Service Worker: Enabled (Offline First)');
  console.log('  Press Ctrl+C to terminate server.\n');
});
