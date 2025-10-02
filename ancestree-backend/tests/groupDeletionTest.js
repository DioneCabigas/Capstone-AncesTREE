const familyTreeService = require('../src/services/familyTreeService');
const familyGroupService = require('../src/services/familyGroupService');
const personService = require('../src/services/personService');
const groupMembershipService = require('../src/services/groupMembershipService');

// Test user data
const TEST_OWNER_ID = 'test-group-owner';
const TEST_MEMBER_ID = 'test-group-member';

const TEST_OWNER_DATA = {
  firstName: 'GroupOwner',
  lastName: 'TestUser',
  birthDate: '1990-01-01',
  gender: 'female',
  birthPlace: 'Test City'
};

const TEST_MEMBER_DATA = {
  firstName: 'GroupMember',
  lastName: 'TestUser',
  birthDate: '1992-01-01',
  gender: 'male',
  birthPlace: 'Test City'
};

async function testGroupDeletion() {
  console.log('🧪 TESTING GROUP DELETION WITH MEMBER CLEANUP\n');

  try {
    console.log('=== STEP 1: Create Personal Trees for Owner and Member ===');
    
    // Create personal tree for owner
    const ownerTreeId = await familyTreeService.createNewFamilyTree(
      TEST_OWNER_ID,
      `personal-${TEST_OWNER_ID}`,
      TEST_OWNER_DATA
    );
    console.log(`✅ Owner personal tree created: ${ownerTreeId}`);

    // Create personal tree for member
    const memberTreeId = await familyTreeService.createNewFamilyTree(
      TEST_MEMBER_ID,
      `personal-${TEST_MEMBER_ID}`,
      TEST_MEMBER_DATA
    );
    console.log(`✅ Member personal tree created: ${memberTreeId}`);

    console.log('\n=== STEP 2: Create Family Group (Owner) ===');
    const groupId = await familyGroupService.createGroup(
      TEST_OWNER_ID,
      null,
      'TestDeletionGroup',
      'Test group for deletion'
    );
    console.log(`✅ Family group created: ${groupId}`);

    // Get the group to find its tree ID
    const group = await familyGroupService.getGroupById(groupId);
    const groupTreeId = group.treeId;
    console.log(`Group tree ID: ${groupTreeId}`);

    console.log('\n=== STEP 3: Add Member to Group ===');
    const addResult = await groupMembershipService.addUserToGroupTree(TEST_MEMBER_ID, groupTreeId);
    console.log(`Add member result: ${addResult.message}`);

    console.log('\n=== STEP 4: Add a Person Directly to Group Tree ===');
    const directPerson = await personService.createPerson(groupTreeId, {
      firstName: 'DirectGroup',
      middleName: '',
      lastName: 'Person',
      birthDate: '1970-01-01',
      birthPlace: '',
      gender: 'female',
      status: 'living'
    });
    console.log(`✅ Added direct person to group: ${directPerson.personId}`);

    console.log('\n=== STEP 5: Verify Group State Before Deletion ===');
    const groupMembers = await personService.getPeopleByGroupTreeId(groupTreeId);
    console.log(`Group members before deletion: ${groupMembers.length}`);
    
    // Check owner status
    const ownerPerson = await personService.getPersonById(TEST_OWNER_ID);
    const memberPerson = await personService.getPersonById(TEST_MEMBER_ID);
    
    console.log(`Owner groupTreeIds: ${JSON.stringify(ownerPerson.groupTreeIds)}`);
    console.log(`Member groupTreeIds: ${JSON.stringify(memberPerson.groupTreeIds)}`);
    
    const ownerHasGroup = ownerPerson.groupTreeIds?.includes(groupTreeId);
    const memberHasGroup = memberPerson.groupTreeIds?.includes(groupTreeId);
    console.log(`Owner in group: ${ownerHasGroup ? '✅ YES' : '❌ NO'}`);
    console.log(`Member in group: ${memberHasGroup ? '✅ YES' : '❌ NO'}`);

    console.log('\n=== STEP 6: Delete Group (This should remove all members first) ===');
    const deleteResult = await familyGroupService.deleteGroup(groupId);
    console.log(`Delete result: ${deleteResult.message}`);
    console.log(`Cleanup details:`, deleteResult.cleanup);

    console.log('\n=== STEP 7: Verify Cleanup After Deletion ===');
    
    // Check that the group document is gone
    const groupAfterDeletion = await familyGroupService.getFamilyGroupById(groupId);
    console.log(`Group document deleted: ${!groupAfterDeletion ? '✅ YES' : '❌ NO'}`);
    
    // Check that users were removed from group tree
    const ownerAfter = await personService.getPersonById(TEST_OWNER_ID);
    const memberAfter = await personService.getPersonById(TEST_MEMBER_ID);
    
    console.log(`Owner still exists: ${ownerAfter ? '✅ YES' : '❌ NO'}`);
    console.log(`Member still exists: ${memberAfter ? '✅ YES' : '❌ NO'}`);
    
    const ownerStillInGroup = ownerAfter?.groupTreeIds?.includes(groupTreeId);
    const memberStillInGroup = memberAfter?.groupTreeIds?.includes(groupTreeId);
    console.log(`Owner removed from group: ${!ownerStillInGroup ? '✅ YES' : '❌ NO'}`);
    console.log(`Member removed from group: ${!memberStillInGroup ? '✅ YES' : '❌ NO'}`);
    
    // Check that direct person was deleted entirely
    const directPersonAfter = await personService.getPersonById(directPerson.personId);
    console.log(`Direct person deleted: ${!directPersonAfter ? '✅ YES' : '❌ NO'}`);
    
    // Check that group tree has no members
    const groupMembersAfter = await personService.getPeopleByGroupTreeId(groupTreeId);
    console.log(`Group tree members after deletion: ${groupMembersAfter.length} (should be 0)`);

    console.log('\n=== STEP 8: Verify Personal Trees Are Intact ===');
    const ownerPersonalTreePersons = await personService.getPeopleByTreeId(ownerTreeId);
    const memberPersonalTreePersons = await personService.getPeopleByTreeId(memberTreeId);
    
    console.log(`Owner personal tree intact: ${ownerPersonalTreePersons.length === 1 ? '✅ YES' : '❌ NO'} (${ownerPersonalTreePersons.length} persons)`);
    console.log(`Member personal tree intact: ${memberPersonalTreePersons.length === 1 ? '✅ YES' : '❌ NO'} (${memberPersonalTreePersons.length} persons)`);

    const success = !groupAfterDeletion && 
                   ownerAfter && memberAfter &&
                   !ownerStillInGroup && !memberStillInGroup &&
                   !directPersonAfter &&
                   groupMembersAfter.length === 0 &&
                   ownerPersonalTreePersons.length === 1 &&
                   memberPersonalTreePersons.length === 1;

    if (success) {
      console.log('\n🎉 SUCCESS: Group deletion with member cleanup is working!');
      console.log('✅ Group document deleted');
      console.log('✅ All members removed from group');
      console.log('✅ Direct group persons deleted');
      console.log('✅ Personal trees preserved');
      console.log('✅ Group tree cleaned up');
      return true;
    } else {
      console.log('\n💥 FAILURE: Group deletion has issues');
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
  testGroupDeletion().then(success => {
    if (success) {
      console.log('\n✨ Group deletion functionality is working correctly!');
    } else {
      console.log('\n⚠️ Group deletion functionality needs fixing.');
    }
  });
}

module.exports = { testGroupDeletion, TEST_OWNER_ID, TEST_MEMBER_ID };