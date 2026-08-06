const { fetchCompanyNews } = require('../lib/googleNews');
module.exports = async (req, res) => {
  const query = req.query?.q;
  const data = await fetchCompanyNews(query, 15);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(data);
};
