const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const TEST_UID = 'test-user-123';

async function testSettingsAPI() {
  console.log('🧪 Testing Settings API Functionality...\n');

  try {
    // Test 1: Save settings
    console.log('1. Testing settings save...');
    const saveResponse = await axios.post(`${BASE_URL}/api/settings/user`, {
      uid: TEST_UID,
      preferences: {
        familyGroups: true,
        connectRequests: false,
        newsletter: true,
      },
      permissions: {
        allowView: false,
        appearInSearch: true,
        exportTree: false,
      },
    });
    
    console.log('✅ Settings saved successfully:', saveResponse.data.message);

    // Test 2: Retrieve settings
    console.log('\n2. Testing settings retrieval...');
    const getResponse = await axios.get(`${BASE_URL}/api/settings/user/${TEST_UID}`);
    
    console.log('✅ Settings retrieved successfully:');
    console.log('   Preferences:', getResponse.data.preferences);
    console.log('   Permissions:', getResponse.data.permissions);

    // Test 3: Test search filtering (if user has appearInSearch = false)
    console.log('\n3. Testing search filtering...');
    
    // First, set appearInSearch to false
    await axios.post(`${BASE_URL}/api/settings/user`, {
      uid: TEST_UID,
      preferences: {
        familyGroups: true,
        connectRequests: false,
        newsletter: true,
      },
      permissions: {
        allowView: false,
        appearInSearch: false, // Hide from search
        exportTree: false,
      },
    });
    
    console.log('✅ Set appearInSearch to false');
    
    // Try to search for this user
    const searchResponse = await axios.get(`${BASE_URL}/api/search?search=test`);
    console.log('✅ Search completed, results:', searchResponse.data.results.length, 'users found');
    
    const foundTestUser = searchResponse.data.results.find(user => user.id === TEST_UID);
    if (foundTestUser) {
      console.log('❌ ERROR: User appeared in search despite appearInSearch = false');
    } else {
      console.log('✅ User correctly hidden from search results');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

// Run the test
testSettingsAPI();