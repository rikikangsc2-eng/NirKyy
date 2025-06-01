const axios = require('axios');

module.exports = async (req, res) => {
  const { text_atas, text_bawah, background } = req.query;
  let url = 'https://api.memegen.link/images/custom';

  if (text_atas || text_bawah) {
    const atas = text_atas ? encodeURIComponent(text_atas) : ' ';
    const bawah = text_bawah ? encodeURIComponent(text_bawah) : ' ';
    url += `/${atas}/${bawah}.png`;
  } else {
    return res.status(400).json({ error: 'Parameter text-atas atau text-bawah harus diisi.' });
  }

  if (background) {
    url += `?background=${encodeURIComponent(background)}`;
  }

  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    res.set('Content-Type', 'image/png');
    res.send(Buffer.from(response.data));
  } catch (error) {
    console.error('Error saat memanggil API memegen:', error);
    res.status(500).json({ error: 'Terjadi kesalahan saat memproses permintaan.' });
  }
};
