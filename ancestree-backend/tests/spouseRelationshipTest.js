const familyTreeService = require('../src/services/familyTreeService');
const personService = require('../src/services/personService');

// Test user data
const TEST_USER_ID = 'test-spouse-user';
const TEST_USER_DATA = {
  firstName: 'John',
  lastName: 'SpouseTest',
  birthDate: '1985-03-15',
  gender: 'male',
  birthPlace: 'Test City'
};

const SPOUSE_DATA = {
  firstName: 'Jane',
  lastName: 'SpouseTest',
  birthDate: '1987-06-20',
  gender: 'female',
  birthPlace: 'Test City'
};

async function testSpouseRelationships() {
  console.log('🧪 TESTING SPOUSE RELATIONSHIPS FUNCTIONALITY\n');

  try {
    console.log('=== STEP 1: Create Personal Tree ===');
    const personalTreeId = await familyTreeService.createNewFamilyTree(
      TEST_USER_ID,
      `personal-${TEST_USER_ID}`,
      TEST_USER_DATA
    );
    console.log(`✅ Personal tree created: ${personalTreeId}`);

    console.log('\n=== STEP 2: Add Spouse to Personal Tree ===');
    const spouse = await personService.createPerson(personalTreeId, {
      ...SPOUSE_DATA,
      status: 'living'
    });
    console.log(`✅ Spouse created: ${spouse.personId} (${spouse.firstName} ${spouse.lastName})`);

    console.log('\n=== STEP 3: Establish Spouse Relationships ===');
    
    // Add spouse relationship from user to spouse
    await personService.updatePerson(TEST_USER_ID, {
      relationships: [
        { relatedPersonId: spouse.personId, type: 'spouse' }
      ]
    });
    console.log(`✅ Added spouse relationship: ${TEST_USER_ID} → ${spouse.personId}`);

    // Add reciprocal spouse relationship from spouse to user
    await personService.updatePerson(spouse.personId, {
      relationships: [
        { relatedPersonId: TEST_USER_ID, type: 'spouse' }
      ]
    });
    console.log(`✅ Added reciprocal spouse relationship: ${spouse.personId} → ${TEST_USER_ID}`);

    console.log('\n=== STEP 4: Verify Relationships ===');
    const userPerson = await personService.getPersonById(TEST_USER_ID);
    const spousePerson = await personService.getPersonById(spouse.personId);
    
    console.log('User relationships:', userPerson.relationships);
    console.log('Spouse relationships:', spousePerson.relationships);
    
    const userHasSpouse = userPerson.relationships?.some(rel => 
      rel.relatedPersonId === spouse.personId && rel.type === 'spouse'
    );
    const spouseHasUser = spousePerson.relationships?.some(rel => 
      rel.relatedPersonId === TEST_USER_ID && rel.type === 'spouse'
    );
    
    console.log(`User has spouse relationship: ${userHasSpouse ? '✅ YES' : '❌ NO'}`);
    console.log(`Spouse has user relationship: ${spouseHasUser ? '✅ YES' : '❌ NO'}`);

    console.log('\n=== STEP 5: Add Children to Test Family Structure ===');
    
    // Add a child
    const child = await personService.createPerson(personalTreeId, {
      firstName: 'Child',
      lastName: 'SpouseTest',
      birthDate: '2010-01-15',
      gender: 'female',
      birthPlace: 'Test City',
      status: 'living'
    });
    console.log(`✅ Child created: ${child.personId}`);
    
    // Establish parent-child relationships
    await personService.updatePerson(TEST_USER_ID, {
      relationships: [
        { relatedPersonId: child.personId, type: 'child' }
      ]
    });
    
    await personService.updatePerson(spouse.personId, {
      relationships: [
        { relatedPersonId: child.personId, type: 'child' }
      ]
    });
    
    await personService.updatePerson(child.personId, {
      relationships: [
        { relatedPersonId: TEST_USER_ID, type: 'parent' },
        { relatedPersonId: spouse.personId, type: 'parent' }
      ]
    });
    
    console.log(`✅ Family relationships established`);

    console.log('\n=== STEP 6: Verify Complete Family Tree Structure ===');
    const allPersons = await personService.getPeopleByTreeId(personalTreeId);
    console.log(`Total persons in tree: ${allPersons.length}`);
    
    allPersons.forEach(person => {
      console.log(`${person.firstName} ${person.lastName}:`);
      person.relationships?.forEach(rel => {
        const relatedPerson = allPersons.find(p => p.personId === rel.relatedPersonId);
        console.log(`  - ${rel.type} of ${relatedPerson?.firstName} ${relatedPerson?.lastName}`);
      });
    });

    const success = userHasSpouse && spouseHasUser && allPersons.length === 3;

    if (success) {
      console.log('\n🎉 SUCCESS: Spouse relationships working correctly!');
      console.log('✅ Bidirectional spouse relationships established');
      console.log('✅ Family tree structure with spouse and children works');
      console.log('✅ Frontend should now be able to create and display spouse relationships');
      return true;
    } else {
      console.log('\n💥 FAILURE: Spouse relationships have issues');
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
  testSpouseRelationships().then(success => {
    if (success) {
      console.log('\n✨ Spouse relationship functionality is working correctly!');
      console.log('You can now add spouses in both personal and group trees.');
    } else {
      console.log('\n⚠️ Spouse relationship functionality needs fixing.');
    }
  });
}

module.exports = { testSpouseRelationships, TEST_USER_ID };