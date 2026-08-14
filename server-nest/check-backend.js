const axios = require('axios');

async function checkBackend() {
  console.log('🔍 Checking backend status...\n');

  // Check if backend is running
  try {
    const healthCheck = await axios.get('http://localhost:4000/api/health').catch(() => null);
    if (healthCheck) {
      console.log('✅ Backend is running on port 4000\n');
    } else {
      console.log('⚠️  Backend might not be running or health endpoint not available\n');
    }
  } catch (error) {
    console.log('⚠️  Could not check backend health\n');
  }

  // Try to login and send a test message
  try {
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
      email: 'ceo@gmail.com',
      password: 'Ceo@2026'
    });
    
    const token = loginResponse.data.data?.token || loginResponse.data.data?.access_token || loginResponse.data.access_token;
    console.log('✅ Login successful\n');

    // Test the chat endpoint
    console.log('Step 2: Sending test message to AI...');
    const chatResponse = await axios.post(
      'http://localhost:4000/api/ai/chat',
      {
        message: 'Hello',
        provider: 'gemini'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Chat endpoint is working!');
    console.log('📝 Response:', JSON.stringify(chatResponse.data, null, 2));
    console.log('\n✅ BACKEND IS FULLY FUNCTIONAL\n');
    
  } catch (error) {
    console.log('\n❌ ERROR DETECTED:\n');
    if (error.response) {
      console.log('Status Code:', error.response.status);
      console.log('Error Message:', error.response.data?.message || error.response.statusText);
      console.log('Full Error:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 400) {
        console.log('\n💡 LIKELY ISSUE: Backend needs to be restarted to load new code');
        console.log('   Run: npm run start:dev (in server-nest directory)');
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ BACKEND IS NOT RUNNING');
      console.log('💡 Start it with: npm run start:dev (in server-nest directory)');
    } else {
      console.log('Error:', error.message);
    }
  }
}

checkBackend();
