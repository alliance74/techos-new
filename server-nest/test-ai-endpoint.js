const axios = require('axios');

// Test AI Chat Endpoint
async function testAIChat() {
  console.log('🧪 Testing AI Chat Endpoint...\n');

  // First, login to get a token
  console.log('Step 1: Logging in as CEO...');
  try {
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'ceo@gmail.com',
      password: 'Ceo@2026'
    });
    
    const token = loginResponse.data.data?.token || loginResponse.data.data?.access_token || loginResponse.data.access_token;
    
    if (!token) {
      console.log('❌ No token found in response!');
      console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
      return;
    }
    
    console.log('✅ Login successful! Token obtained.\n');

    // Test 1: Valid request with Gemini
    console.log('Step 2: Testing valid AI chat request with Gemini...');
    try {
      const chatResponse = await axios.post(
        'http://localhost:4000/api/ai/chat',
        {
          message: 'Hello, what can you tell me about my projects?',
          provider: 'gemini'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('✅ AI Chat Response:', JSON.stringify(chatResponse.data, null, 2));
    } catch (error) {
      console.log('❌ AI Chat Error:');
      console.log('Status:', error.response?.status);
      console.log('Error Message:', error.response?.data?.message);
      console.log('Full Error:', JSON.stringify(error.response?.data, null, 2));
    }

    // Test 2: Empty message
    console.log('\nStep 3: Testing empty message (should fail)...');
    try {
      await axios.post(
        'http://localhost:4000/api/ai/chat',
        {
          message: '',
          provider: 'openai'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.log('Expected Error:', error.response?.data?.message);
    }

    // Test 3: Missing message
    console.log('\nStep 4: Testing missing message (should fail)...');
    try {
      await axios.post(
        'http://localhost:4000/api/ai/chat',
        {
          provider: 'openai'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.log('Expected Error:', error.response?.data?.message);
    }

    // Test 4: Invalid provider
    console.log('\nStep 5: Testing invalid provider (should fail)...');
    try {
      await axios.post(
        'http://localhost:4000/api/ai/chat',
        {
          message: 'Test',
          provider: 'invalid'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.log('Expected Error:', error.response?.data?.message);
    }

  } catch (loginError) {
    console.log('❌ Login failed:');
    console.log('Status:', loginError.response?.status);
    console.log('Error:', loginError.response?.data);
  }
}

// Run the test
testAIChat().catch(console.error);
