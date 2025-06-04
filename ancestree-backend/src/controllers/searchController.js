const searchService = require('../services/searchService');

exports.searchUsers = async (req, res) => {
  const { search = '', city = '', country = '' } = req.query;

  try {
    const searchResult = await searchService.searchUsers(search, city, country);
    res.status(200).json(searchResult);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ message: 'Failed to search users.' });
  }
};