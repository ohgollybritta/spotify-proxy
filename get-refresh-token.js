#!/usr/bin/env node
// ─────────────────────────────────────────────
// get-refresh-token.js
// Run this ONCE locally to get your refresh token.
//
// Usage:
//   node get-refresh-token.js YOUR_CLIENT_ID YOUR_CLIENT_SECRET
//
// It will print a URL. Open it, authorize, then paste
// the "code" parameter from the redirect URL back here.
// ─────────────────────────────────────────────

const http = require('http');
const https = require('https');
const url = require('url');

const CLIENT_ID     = process.argv[2];
const CLIENT_SECRET = process.argv[3];
const REDIRECT_URI  = 'http://localhost:8888/callback';
const SCOPES        = 'user-read-recently-played user-read-currently-playing';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.log('\nUsage: node get-refresh-token.js <CLIENT_ID> <CLIENT_SECRET>\n');
  process.exit(1);
}

const authUrl =
  'https://accounts.spotify.com/authorize?' +
  'response_type=code' +
  '&client_id=' + CLIENT_ID +
  '&scope=' + encodeURIComponent(SCOPES) +
  '&redirect_uri=' + encodeURIComponent(REDIRECT_URI);

console.log('\n1) Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n2) Authorize the app. You\'ll be redirected to localhost:8888.\n');
console.log('Waiting for callback...\n');

const server = http.createServer((req, res) => {
  const query = url.parse(req.url, true).query;
  if (!query.code) {
    res.end('No code found. Try again.');
    return;
  }

  const postData =
    'grant_type=authorization_code' +
    '&code=' + encodeURIComponent(query.code) +
    '&redirect_uri=' + encodeURIComponent(REDIRECT_URI);

  const options = {
    hostname: 'accounts.spotify.com',
    path: '/api/token',
    method: 'POST',
    headers: {
      'Content-Type':  'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
    },
  };

  const tokenReq = https.request(options, (tokenRes) => {
    let body = '';
    tokenRes.on('data', (chunk) => body += chunk);
    tokenRes.on('end', () => {
      const data = JSON.parse(body);
      if (data.refresh_token) {
        console.log('✅ SUCCESS!\n');
        console.log('───────────────────────────────────────');
        console.log('SPOTIFY_REFRESH_TOKEN=' + data.refresh_token);
        console.log('───────────────────────────────────────\n');
        console.log('Copy that value into your Vercel environment variables.\n');
      } else {
        console.log('❌ Error:', data);
      }
      res.end('Done! You can close this tab.');
      server.close();
    });
  });

  tokenReq.write(postData);
  tokenReq.end();
});

server.listen(8888);
