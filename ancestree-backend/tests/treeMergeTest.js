const treeMergeService = require('../src/services/treeMergeService');
const familyTreeService = require('../src/services/familyTreeService');
const personService = require('../src/services/personService');
const familyGroupService = require('../src/services/familyGroupService');

// Mock user IDs for testing
const TEST_USER_ID = 'test-user-123';
const TEST_GROUP_ID = 'test-group-456';

async function createTestPersonalTree() {
  console.log('🌳 Creating test personal tree...');
  
  // Create personal tree with some test data
  const personalTreeId = await familyTreeService.createNewFamilyTree(
    TEST_USER_ID,
    `personal-${TEST_USER_ID}`,
    {
      firstName: 'John',
      lastName: 'Doe',
      birthDate: '1990-01-01',
      gender: 'male',
      status: 'living'
    }
  );

  // Add a parent
  const parent = await personService.createPerson(personalTreeId, {
    firstName: 'Robert',
    lastName: 'Doe',
    birthDate: '1965-01-01',
    gender: 'male',
    status: 'living',
    relationships: []
  });

  // Add a child
  const child = await personService.createPerson(personalTreeId, {
    firstName: 'Jane',
    lastName: 'Doe',
    birthDate: '2020-01-01',
    gender: 'female',
    status: 'living',
    relationships: []
  });

  // Create relationships
  await personService.updatePerson(TEST_USER_ID, {
    relationships: [
      { relatedPersonId: parent.personId, type: 'parent' },
      { relatedPersonId: child.personId, type: 'child' }
    ]
  });

  await personService.updatePerson(parent.personId, {
    relationships: [{ relatedPersonId: TEST_USER_ID, type: 'child' }]
  });

  await personService.updatePerson(child.personId, {
    relationships: [{ relatedPersonId: TEST_USER_ID, type: 'parent' }]
  });

  console.log(`✅ Personal tree created with ID: ${personalTreeId}`);
  return personalTreeId;
}

async function createTestGroupTree() {
  console.log('👥 Creating test group tree...');
  
  // Create a simple group tree
  const groupTreeId = await familyTreeService.createFamilyTree('group-owner', 'test-group-tree');
  
  console.log(`✅ Group tree created with ID: ${groupTreeId}`);
  return groupTreeId;
}

async function testTreeMerge() {
  console.log('🧪 Starting tree merge test...\n');
  
  try {
    // Step 1: Create test trees
    const personalTreeId = await createTestPersonalTree();
    const groupTreeId = await createTestGroupTree();
    
    // Step 2: Get initial counts
    const initialPersonalPersons = await personService.getPeopleByTreeId(personalTreeId);
    const initialGroupPersons = await personService.getPeopleByTreeId(groupTreeId);
    
    console.log(`\n📊 Initial state:`);
    console.log(`   Personal tree persons: ${initialPersonalPersons.length}`);
    console.log(`   Group tree persons: ${initialGroupPersons.length}`);
    
    // Step 3: Execute merge
    console.log('\n🔄 Executing merge...');
    const mergeResult = await treeMergeService.mergePersonalTreeIntoGroup(TEST_USER_ID, groupTreeId);
    
    console.log('✅ Merge completed:', mergeResult.message);
    console.log(`   Merged persons: ${mergeResult.mergedPersons}`);
    
    // Step 4: Verify personal tree is preserved
    const finalPersonalPersons = await personService.getPeopleByTreeId(personalTreeId);
    const finalGroupPersons = await personService.getPeopleByTreeId(groupTreeId);
    
    console.log(`\n📊 Final state:`);
    console.log(`   Personal tree persons: ${finalPersonalPersons.length}`);
    console.log(`   Group tree persons: ${finalGroupPersons.length}`);
    
    // Step 5: Validate results
    console.log('\n✨ Validation:');
    
    if (finalPersonalPersons.length === initialPersonalPersons.length) {
      console.log('✅ Personal tree integrity preserved');
    } else {
      console.log('❌ Personal tree lost persons!');
    }
    
    if (finalGroupPersons.length === initialGroupPersons.length + mergeResult.mergedPersons) {
      console.log('✅ Group tree received correct number of persons');
    } else {
      console.log('❌ Group tree person count mismatch!');
    }
    
    // Step 6: Get merge stats
    const stats = await treeMergeService.getTreeMergeStats(groupTreeId);
    console.log('\n📈 Group tree statistics:', stats);
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testTreeMerge();
}

module.exports = { testTreeMerge, TEST_USER_ID, TEST_GROUP_ID };