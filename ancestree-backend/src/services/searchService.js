const admin = require('../config/database');
const Search = require('../entities/Search');

const db = admin.firestore();

exports.searchUsers = async (searchTerm = '', city = '', country = '') => {
  const snapshot = await db.collection('users').get();
  const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const searchTokens = searchTerm.toLowerCase().trim().split(' ').filter(Boolean);

  // First filter based on search criteria
  const matchingUsers = allUsers.filter(user => {
    const firstName = user.firstName?.toLowerCase() || '';
    const lastName = user.lastName?.toLowerCase() || '';
    const cityAddress = user.cityAddress?.toLowerCase() || '';
    const countryAddress = user.countryAddress?.toLowerCase() || '';

    const nameMatch = searchTokens.every(token =>
      firstName.includes(token) || lastName.includes(token)
    );

    const cityMatch = !city || cityAddress === city.toLowerCase();
    const countryMatch = !country || countryAddress === country.toLowerCase();

    return nameMatch && cityMatch && countryMatch;
  });

  // Now filter based on privacy permissions
  const publicUsers = [];
  
  for (const user of matchingUsers) {
    try {
      // Check if user has privacy settings that allow them to appear in search
      const userDoc = await db.collection('users').doc(user.id).get();
      const userData = userDoc.exists ? userDoc.data() : {};
      
      // Default to true if no permission setting exists (for backward compatibility)
      const appearInSearch = userData.permissions?.appearInSearch !== false;
      
      if (appearInSearch) {
        publicUsers.push(user);
      }
    } catch (error) {
      console.error(`Error checking privacy settings for user ${user.id}:`, error);
      // On error, default to showing the user (fail-open for better user experience)
      publicUsers.push(user);
    }
  }

  const search = new Search();
  search.setUser(searchTerm);
  search.setCity(city);
  search.setCountry(country);
  search.setResults(publicUsers);

  return search.toJSON();
};
