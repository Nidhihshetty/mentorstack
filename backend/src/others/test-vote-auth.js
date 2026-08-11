const axios = require('axios');
const jwt = require('jsonwebtoken');

// Create a valid JWT token for testing
const token = jwt.sign({ userId: 1, role: 'mentee' }, 'fallback_secret', { expiresIn: '1h' });

console.log('Testing vote endpoint with authentication...');

axios.post('http://localhost:5000/api/questions/1/vote', 
  { voteType: 'upvote' },
  { 
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }
).then(res => {
  console.log('✅ Vote successful!');
  console.log('Response:', res.data);
}).catch(err => {
  console.log('❌ Vote failed!');
  console.log('Status:', err.response?.status);
  console.log('Error:', err.response?.data || err.message);
});
