/**
 * Simple HTTP Server for testing Vetra
 * Serves test-devnet-transaction.html on http://localhost:8080
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const server = http.createServer((req, res) => {
  console.log(`📥 Request: ${req.method} ${req.url}`);

  // Serve test page
  if (req.url === '/' || req.url === '/test') {
    const filePath = path.join(__dirname, 'test-devnet-transaction.html');
    
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading test page');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
    return;
  }

  // 404
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log('🚀 Test server running!');
  console.log(`📍 Open: http://localhost:${PORT}`);
  console.log('');
  console.log('🧪 Instructions:');
  console.log('1. Open http://localhost:8080 in Chrome');
  console.log('2. Make sure Phantom is in Devnet mode');
  console.log('3. Connect wallet and test transaction');
  console.log('4. Check if Vetra intercepts!');
  console.log('');
  console.log('Press Ctrl+C to stop');
});

