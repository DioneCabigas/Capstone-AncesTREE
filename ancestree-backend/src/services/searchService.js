const admin = require('../config/database');
const Search = require('../entities/Search');

const db = admin.firestore();

exports.searchUsers = async (searchTerm = '', city = '', country = '') => {
  const snapshot = await db.collection('users').get();
  const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  const searchTokens = searchTerm.toLowerCase().trim().split(' ').filter(Boolean);

  const filtered = allUsers.filter(user => {
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

  const search = new Search();
  search.setUser(searchTerm);
  search.setCity(city);
  search.setCountry(country);
  search.setResults(filtered);

  return search.toJSON();
};