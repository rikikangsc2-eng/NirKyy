const axios = require('axios');

module.exports = async (req, res) => {
  const imageUrl = req.query.url;

  if (!imageUrl) {
    return res.errorJson('Parameter url wajib diisi', 400);
  }

  try {
    const apiUrl = `https://nirkyy-api.hf.space/api/togihibli?url=${encodeURIComponent(imageUrl)}`;
    const response = await axios.get(apiUrl, {
      responseType: 'arraybuffer'
    });

    res.writeHead(200, {
      'Content-Type': response.headers['content-type'],
      'Content-Length': response.headers['content-length']
    });
    res.end(response.data);
  } catch (error) {
    console.error('Error:', error);
    res.errorJson('Terjadi kesalahan saat memproses gambar Ghibli: ' + error.message, 500);
  }
};
