const familyTreeService = require('../src/services/familyTreeService');
const familyGroupService = require('../src/services/familyGroupService');
const personService = require('../src/services/personService');
const groupMembershipService = require('../src/services/groupMembershipService');

// Test user data
const TEST_USER_ID = 'test-endpoint-user';
const TEST_USER_DATA = {
  firstName: 'EndpointTest',
  lastName: 'User',
  birthDate: '1990-01-01',
  gender: 'female',
  birthPlace: 'Test City'
};

async function testGroupTreeEndpoint() {
  console.log('🧪 TESTING GROUP TREE ENDPOINT\n');

  try {
    console.log('=== STEP 1: Create Personal Tree ===');
    const personalTreeId = await familyTreeService.createNewFamilyTree(
      TEST_USER_ID,
      `personal-${TEST_USER_ID}`,
      TEST_USER_DATA
    );
    console.log(`✅ Personal tree created: ${personalTreeId}`);

    console.log('\n=== STEP 2: Create Family Group ===');
    const groupId = await familyGroupService.createGroup(
      TEST_USER_ID,
      null,
      'TestEndpointGroup',
      'Test group for endpoint testing'
    );
    console.log(`✅ Family group created: ${groupId}`);

    // Get the group to find its tree ID
    const group = await familyGroupService.getGroupById(groupId);
    const groupTreeId = group.treeId;
    console.log(`Group tree ID: ${groupTreeId}`);

    console.log('\n=== STEP 3: Verify User is in Group Tree ===');
    
    // Test regular tree endpoint (should return empty or minimal results)
    console.log('Testing regular tree endpoint...');
    try {
      const regularTreePeople = await personService.getPeopleByTreeId(groupTreeId);
      console.log(`Regular tree endpoint found ${regularTreePeople.length} people`);
      
      if (regularTreePeople.length > 0) {
        console.log('Regular tree people:', regularTreePeople.map(p => ({
          personId: p.personId,
          name: `${p.firstName} ${p.lastName}`,
          treeId: p.treeId,
          groupTreeIds: p.groupTreeIds
        })));
      }
    } catch (error) {
      console.log(`Regular tree endpoint error: ${error.message}`);
    }

    // Test group tree endpoint (should return the user)
    console.log('\nTesting group tree endpoint...');
    try {
      const groupTreePeople = await personService.getPeopleByGroupTreeId(groupTreeId);
      console.log(`Group tree endpoint found ${groupTreePeople.length} people`);
      
      if (groupTreePeople.length > 0) {
        console.log('Group tree people:', groupTreePeople.map(p => ({
          personId: p.personId,
          name: `${p.firstName} ${p.lastName}`,
          treeId: p.treeId,
          groupTreeIds: p.groupTreeIds
        })));
        
        // Check if user is in the results
        const userInResults = groupTreePeople.find(p => p.personId === TEST_USER_ID);
        console.log(`User found in group tree results: ${userInResults ? '✅ YES' : '❌ NO'}`);
        
        if (userInResults) {
          console.log('User details:', {
            personId: userInResults.personId,
            name: `${userInResults.firstName} ${userInResults.lastName}`,
            treeId: userInResults.treeId,
            groupTreeIds: userInResults.groupTreeIds,
            hasGroupTreeId: userInResults.groupTreeIds?.includes(groupTreeId)
          });
        }
      }
    } catch (error) {
      console.log(`Group tree endpoint error: ${error.message}`);
    }

    console.log('\n=== STEP 4: Add Another User to Test Multi-User Scenario ===');
    const testMemberId = 'test-endpoint-member';
    const memberTreeId = await familyTreeService.createNewFamilyTree(
      testMemberId,
      `personal-${testMemberId}`,
      {
        firstName: 'TestMember',
        lastName: 'User',
        birthDate: '1992-01-01',
        gender: 'male',
        birthPlace: 'Test City'
      }
    );
    console.log(`✅ Member personal tree created: ${memberTreeId}`);

    // Add member to group
    const addResult = await groupMembershipService.addUserToGroupTree(testMemberId, groupTreeId);
    console.log(`✅ Added member to group: ${addResult.message}`);

    console.log('\n=== STEP 5: Test Multi-User Group Tree Endpoint ===');
    const finalGroupTreePeople = await personService.getPeopleByGroupTreeId(groupTreeId);
    console.log(`Final group tree endpoint found ${finalGroupTreePeople.length} people`);
    
    if (finalGroupTreePeople.length > 0) {
      console.log('Final group tree people:', finalGroupTreePeople.map(p => ({
        personId: p.personId,
        name: `${p.firstName} ${p.lastName}`,
        treeId: p.treeId,
        groupTreeIds: p.groupTreeIds
      })));
    }

    const success = finalGroupTreePeople.length >= 2 && 
                   finalGroupTreePeople.some(p => p.personId === TEST_USER_ID) &&
                   finalGroupTreePeople.some(p => p.personId === testMemberId);

    if (success) {
      console.log('\n🎉 SUCCESS: Group tree endpoint is working correctly!');
      console.log('✅ Users are properly returned by group tree endpoint');
      console.log('✅ Frontend should now be able to see group members');
      return true;
    } else {
      console.log('\n💥 FAILURE: Group tree endpoint has issues');
      return false;
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error);
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testGroupTreeEndpoint().then(success => {
    if (success) {
      console.log('\n✨ The group tree endpoint is working correctly!');
      console.log('Your user node should now appear in the family group tree.');
    } else {
      console.log('\n⚠️ The group tree endpoint needs fixing.');
    }
  });
}

module.exports = { testGroupTreeEndpoint, TEST_USER_ID };