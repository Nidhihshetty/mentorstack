const http = require('http');

// Test data
const postData = JSON.stringify({
  voteType: 'upvote'
});

// Request options
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/questions/1/vote',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing vote endpoint...');
console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response Body:', data);
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e.message);
});

req.write(postData);
req.end();
