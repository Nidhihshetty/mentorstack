const http = require('http');

// Test voting endpoint
const testVote = () => {
  const postData = JSON.stringify({
    voteType: 'upvote'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/questions/1/vote',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer fake-token-for-test',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log('Response:', data);
    });
  });

  req.on('error', (error) => {
    console.error('❌ Vote Request Error:', error.message);
  });

  req.write(postData);
  req.end();
};

testVote();
