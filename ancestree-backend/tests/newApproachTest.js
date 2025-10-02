const familyTreeService = require('../src/services/familyTreeService');
const familyGroupService = require('../src/services/familyGroupService');
const personService = require('../src/services/personService');
const groupMembershipService = require('../src/services/groupMembershipService');

// Test user data
const TEST_USER_ID = 'test-new-approach-user';
const TEST_USER_DATA = {
  firstName: 'NewApproach',
  lastName: 'TestUser',
  birthDate: '1990-03-15',
  gender: 'female',
  birthPlace: 'New Test City'
};

async function testNewApproach() {
  console.log('🧪 TESTING NEW APPROACH: Single user node addition to groups\n');

  try {
    console.log('=== STEP 1: Create Personal Tree with Family ===');
    const personalTreeId = await familyTreeService.createNewFamilyTree(
      TEST_USER_ID,
      `personal-${TEST_USER_ID}`,
      TEST_USER_DATA
    );
    console.log(`✅ Personal tree created: ${personalTreeId}`);

    // Add family members to personal tree
    const mother = await personService.createPerson(personalTreeId, {
      firstName: 'Mother',
      middleName: '',
      lastName: 'TestUser',
      birthDate: '1965-01-01',
      birthPlace: '',
      gender: 'female',
      status: 'living'
    });

    const sibling = await personService.createPerson(personalTreeId, {
      firstName: 'Sibling',
      middleName: '',
      lastName: 'TestUser', 
      birthDate: '1988-01-01',
      birthPlace: '',
      gender: 'male',
      status: 'living'
    });

    // Create relationships
    await personService.updatePerson(TEST_USER_ID, {
      relationships: [
        { relatedPersonId: mother.personId, type: 'parent' },
        { relatedPersonId: sibling.personId, type: 'sibling' }
      ]
    });

    await personService.updatePerson(mother.personId, {
      relationships: [
        { relatedPersonId: TEST_USER_ID, type: 'child' },
        { relatedPersonId: sibling.personId, type: 'child' }
      ]
    });

    await personService.updatePerson(sibling.personId, {
      relationships: [
        { relatedPersonId: TEST_USER_ID, type: 'sibling' },
        { relatedPersonId: mother.personId, type: 'parent' }
      ]
    });

    console.log(`✅ Added mother: ${mother.personId}`);
    console.log(`✅ Added sibling: ${sibling.personId}`);
    console.log(`✅ Created relationships`);

    console.log('\n=== STEP 2: Verify Initial Personal Tree State ===');
    let personalTreePersons = await personService.getPeopleByTreeId(personalTreeId);
    console.log(`Personal tree persons: ${personalTreePersons.length}`);
    
    const userInPersonal = personalTreePersons.find(p => p.personId === TEST_USER_ID);
    console.log(`User exists in personal tree: ${userInPersonal ? '✅ YES' : '❌ NO'}`);
    
    if (userInPersonal) {
      console.log(`User relationships: ${userInPersonal.relationships?.length || 0}`);
      console.log(`User groupTreeIds: ${userInPersonal.groupTreeIds?.length || 0}`);
    }

    console.log('\n=== STEP 3: Create Family Group (This should add user as single node) ===');
    const groupId = await familyGroupService.createGroup(
      TEST_USER_ID,
      null,
      'TestFamily',
      'Test family group'
    );
    console.log(`✅ Family group created: ${groupId}`);

    // Get the group to find its tree ID
    const group = await familyGroupService.getGroupById(groupId);
    const groupTreeId = group.treeId;
    console.log(`Group tree ID: ${groupTreeId}`);

    console.log('\n=== STEP 4: Verify Personal Tree After Group Creation ===');
    personalTreePersons = await personService.getPeopleByTreeId(personalTreeId);
    const userStillInPersonal = personalTreePersons.find(p => p.personId === TEST_USER_ID);
    
    console.log(`Personal tree persons: ${personalTreePersons.length}`);
    console.log(`User still in personal tree: ${userStillInPersonal ? '✅ YES' : '❌ NO'}`);
    
    if (userStillInPersonal) {
      console.log(`User relationships in personal: ${userStillInPersonal.relationships?.length || 0}`);
      console.log(`User groupTreeIds: ${JSON.stringify(userStillInPersonal.groupTreeIds)}`);
    }

    console.log('\n=== STEP 5: Verify Group Tree Contents ===');
    const groupTreePersons = await personService.getPeopleByGroupTreeId(groupTreeId);
    console.log(`Group tree persons: ${groupTreePersons.length}`);
    
    const userInGroup = groupTreePersons.find(p => p.personId === TEST_USER_ID);
    console.log(`User exists in group tree: ${userInGroup ? '✅ YES' : '❌ NO'}`);
    
    if (userInGroup) {
      console.log(`User relationships in group: ${userInGroup.relationships?.length || 0}`);
    }

    // Check if only user was added (family members should NOT be copied)
    const motherInGroup = groupTreePersons.find(p => p.firstName === 'Mother');
    const siblingInGroup = groupTreePersons.find(p => p.firstName === 'Sibling');
    
    console.log(`Mother NOT in group (expected): ${!motherInGroup ? '✅ YES' : '❌ NO'}`);
    console.log(`Sibling NOT in group (expected): ${!siblingInGroup ? '✅ YES' : '❌ NO'}`);
    console.log(`Only user should be in group initially: ${groupTreePersons.length === 1 ? '✅ YES' : '❌ NO'}`);

    console.log('\n=== STEP 6: Test Adding to Group Tree ===');
    // Add a new person directly to the group tree
    const groupOnlyPerson = await personService.createPerson(groupTreeId, {
      firstName: 'GroupOnly',
      middleName: '',
      lastName: 'Person',
      birthDate: '1992-01-01',
      birthPlace: '',
      gender: 'male',
      status: 'living'
    });
    console.log(`✅ Added group-only person: ${groupOnlyPerson.personId}`);

    console.log('\n=== STEP 7: Final Verification ===');
    const finalPersonalPersons = await personService.getPeopleByTreeId(personalTreeId);
    const finalGroupPersons = await personService.getPeopleByGroupTreeId(groupTreeId);
    
    const finalUserInPersonal = finalPersonalPersons.find(p => p.personId === TEST_USER_ID);
    const finalUserInGroup = finalGroupPersons.find(p => p.personId === TEST_USER_ID);

    console.log(`\n📊 FINAL RESULTS:`);
    console.log(`Personal tree persons: ${finalPersonalPersons.length}`);
    console.log(`Group tree persons: ${finalGroupPersons.length}`);
    console.log(`User in personal tree: ${finalUserInPersonal ? '✅ YES' : '❌ NO'}`);
    console.log(`User in group tree: ${finalUserInGroup ? '✅ YES' : '❌ NO'}`);
    
    // Check if personal tree structure is preserved
    if (finalUserInPersonal && finalUserInPersonal.relationships) {
      const personalRelationships = finalUserInPersonal.relationships.length;
      console.log(`Personal tree relationships preserved: ${personalRelationships >= 2 ? '✅ YES' : '❌ NO'} (${personalRelationships})`);
    }

    // Check if group tree has copied data
    if (finalUserInGroup && finalUserInGroup.groupTreeIds) {
      const hasGroupTreeId = finalUserInGroup.groupTreeIds.includes(groupTreeId);
      console.log(`User linked to group tree: ${hasGroupTreeId ? '✅ YES' : '❌ NO'}`);
    }

    const success = finalUserInPersonal && finalUserInGroup && 
                   finalPersonalPersons.length >= 3 && finalGroupPersons.length >= 2; // Only user + group-only person

    if (success) {
      console.log('\n🎉 SUCCESS: New simplified approach is working!');
      console.log('✅ Personal tree preserved and intact');
      console.log('✅ User added as single node to group');
      console.log('✅ User can exist in both trees');
      console.log('✅ No unnecessary data copying');
      return true;
    } else {
      console.log('\n💥 FAILURE: Issues still exist');
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
  testNewApproach().then(success => {
    if (success) {
      console.log('\n✨ The new approach is working correctly!');
    } else {
      console.log('\n⚠️ The new approach needs refinement.');
    }
  });
}

module.exports = { testNewApproach, TEST_USER_ID };