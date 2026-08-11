// Test script to verify community functionality
const API_BASE = 'http://localhost:5000/api';

// Test login first to get a token
async function testLogin() {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'noah.johnson@bootcamp.com',
      password: 'password123'
    }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();
  return data.token;
}

// Test joining a community
async function testJoinCommunity(token, communityId) {
  const response = await fetch(`${API_BASE}/communities/${communityId}/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Join failed');
  }

  return response.json();
}

// Test membership check
async function testMembershipCheck(token, communityId) {
  const response = await fetch(`${API_BASE}/communities/${communityId}/membership`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Membership check failed');
  }

  return response.json();
}

// Test creating a post
async function testCreatePost(token, communityId, title, content) {
  const response = await fetch(`${API_BASE}/communities/${communityId}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      title,
      content,
      imageUrls: []
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Create post failed');
  }

  return response.json();
}

// Test voting on a post
async function testVote(token, communityId, postId, voteType) {
  const response = await fetch(`${API_BASE}/communities/${communityId}/posts/${postId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      voteType
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Vote failed');
  }

  return response.json();
}

// Run all tests
async function runTests() {
  try {
    console.log('🧪 Testing community functionality...\n');

    // 1. Login
    console.log('1. Logging in...');
    const token = await testLogin();
    console.log('✅ Login successful\n');

    // 2. Join community (assuming community ID 1 exists)
    console.log('2. Joining community...');
    try {
      const joinResult = await testJoinCommunity(token, 1);
      console.log('✅ Join successful:', joinResult.message);
    } catch (error) {
      if (error.message.includes('Already a member')) {
        console.log('ℹ️ Already a member of this community');
      } else {
        throw error;
      }
    }
    console.log('');

    // 3. Check membership
    console.log('3. Checking membership...');
    const membershipResult = await testMembershipCheck(token, 1);
    console.log('✅ Membership check:', membershipResult.isMember ? 'Is member' : 'Not a member');
    console.log('');

    // 4. Create a post
    console.log('4. Creating a post...');
    const postResult = await testCreatePost(token, 1, 'Test Post', 'This is a test post created via API');
    console.log('✅ Post created:', postResult.post.title);
    console.log('');

    // 5. Vote on the post
    console.log('5. Voting on the post...');
    const voteResult = await testVote(token, 1, postResult.post.id, 'upvote');
    console.log('✅ Vote successful:', voteResult.message);
    console.log('');

    console.log('🎉 All community functionality tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();
