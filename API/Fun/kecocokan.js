const axios = require('axios');

module.exports = async (req, res) => {
  const { nama1, nama2 } = req.query;
  try {
    const response = await axios.get(
      `https://nirkyy-api.hf.space/api/cupid?nama=${nama1}&nama2=${nama2}`,
      {
        responseType: 'arraybuffer',
      }
    );
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(response.data);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
};
