const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

async function testCommunityFunctionality() {
  console.log('🧪 Testing community functionality...\n');

  try {
    // 1. Login first
    console.log('1. Logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'noah.johnson@bootcamp.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Login failed');
    }

    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful\n');

    // 2. Get all communities first
    console.log('2. Fetching all communities...');
    const communitiesResponse = await fetch(`${API_BASE_URL}/communities`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!communitiesResponse.ok) {
      throw new Error('Failed to fetch communities');
    }

    const communities = await communitiesResponse.json();
    console.log(`✅ Found ${communities.length} communities:`);
    communities.forEach(c => console.log(`   - ${c.name} (ID: ${c.id})`));
    console.log();

    if (communities.length === 0) {
      console.log('❌ No communities found!');
      return;
    }

    const testCommunityId = communities[0].id;
    console.log(`Using community ID: ${testCommunityId}\n`);

    // 3. Check membership status
    console.log('3. Checking membership status...');
    const membershipResponse = await fetch(`${API_BASE_URL}/communities/${testCommunityId}/membership`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!membershipResponse.ok) {
      throw new Error('Failed to check membership');
    }

    const membershipData = await membershipResponse.json();
    console.log(`✅ Membership status: ${membershipData.isMember ? 'Member' : 'Not a member'}\n`);

    // 4. Join community if not a member
    if (!membershipData.isMember) {
      console.log('4. Joining community...');
      const joinResponse = await fetch(`${API_BASE_URL}/communities/${testCommunityId}/join`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!joinResponse.ok) {
        const error = await joinResponse.json();
        throw new Error(`Join failed: ${error.error || error.message}`);
      }

      console.log('✅ Successfully joined community\n');
    } else {
      console.log('4. Already a member of this community\n');
    }

    // 5. Create a test post
    console.log('5. Creating a test post...');
    const postResponse = await fetch(`${API_BASE_URL}/communities/${testCommunityId}/posts`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: 'Test Post from API',
        content: 'This is a test post created via the API to verify functionality works correctly.'
      })
    });

    if (!postResponse.ok) {
      const error = await postResponse.json();
      throw new Error(`Post creation failed: ${error.error || error.message}`);
    }

    const postData = await postResponse.json();
    console.log(`✅ Post created successfully (ID: ${postData.id})\n`);

    // 6. Get community posts
    console.log('6. Fetching community posts...');
    const postsResponse = await fetch(`${API_BASE_URL}/communities/${testCommunityId}/posts`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!postsResponse.ok) {
      throw new Error('Failed to fetch posts');
    }

    const posts = await postsResponse.json();
    console.log(`✅ Found ${posts.length} posts in community\n`);

    // 7. Vote on the first post
    if (posts.length > 0) {
      const firstPost = posts[0];
      console.log('7. Voting on first post...');
      const voteResponse = await fetch(`${API_BASE_URL}/communities/${testCommunityId}/posts/${firstPost.id}/vote`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          voteType: 'upvote'
        })
      });

      if (!voteResponse.ok) {
        const error = await voteResponse.json();
        throw new Error(`Vote failed: ${error.error || error.message}`);
      }

      console.log('✅ Successfully voted on post\n');
    }

    // 8. Test leaving community
    console.log('8. Testing leave community...');
    const leaveResponse = await fetch(`${API_BASE_URL}/communities/${testCommunityId}/leave`, {
      method: 'DELETE',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!leaveResponse.ok) {
      const error = await leaveResponse.json();
      throw new Error(`Leave failed: ${error.error || error.message}`);
    }

    console.log('✅ Successfully left community\n');

    // 9. Rejoin for final state
    console.log('9. Rejoining community...');
    const rejoinResponse = await fetch(`${API_BASE_URL}/communities/${testCommunityId}/join`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!rejoinResponse.ok) {
      const error = await rejoinResponse.json();
      throw new Error(`Rejoin failed: ${error.error || error.message}`);
    }

    console.log('✅ Successfully rejoined community\n');

    console.log('🎉 All community tests passed!');
    console.log('\n📊 Test Summary:');
    console.log('✅ Login');
    console.log('✅ Fetch communities');
    console.log('✅ Check membership');
    console.log('✅ Join community');
    console.log('✅ Create post');
    console.log('✅ Fetch posts');
    console.log('✅ Vote on post');
    console.log('✅ Leave community');
    console.log('✅ Rejoin community');

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

testCommunityFunctionality();
