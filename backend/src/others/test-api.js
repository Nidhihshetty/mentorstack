const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/questions',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const questions = JSON.parse(data);
      console.log('✅ Questions API working');
      console.log('Sample question vote scores:');
      questions.slice(0, 3).forEach(q => {
        console.log(`  Q${q.id}: score ${q.voteScore}`);
      });
    } catch (error) {
      console.error('❌ JSON Parse Error:', error.message);
      console.log('Raw response:', data.substring(0, 200));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
});

req.end();
