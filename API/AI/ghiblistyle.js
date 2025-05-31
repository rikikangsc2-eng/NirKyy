const axios = require('axios');

module.exports = async (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.status(400).json({ error: 'Parameter url wajib diisi' });
  }

  try {
    const apiUrl = `https://nirkyy-api.hf.space/api/togihibli?url=${encodeURIComponent(imageUrl)}`;
    const response = await axios.get(apiUrl, {
      responseType: 'stream'
    });

    res.writeHead(200, {
      'Content-Type': 'image/jpeg'
    });

    return response.data.pipe(res);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan saat memproses gambar Ghibli: ' + error.message });
  }
};
