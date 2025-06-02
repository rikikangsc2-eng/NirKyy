const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.successJson({ message: 'Parameter "query" wajib diisi, cuy!', status: false });
    }
    const targetUrl = `https://express-vercel-ytdl.vercel.app/tiktok?query=${encodeURIComponent(query)}`;
    const response = await axios.get(targetUrl);
    if (response.status !== 200) {
      return res.errorJson({ message: `Gagal ambil data, status: ${response.status}`, status: false },response.status);
    }
    res.successJson({ data: response.data, status: true });
  } catch (e) {
    console.error(e);
    res.errorJson({ message: 'Ada yang error nih pas ngambil data, coba lagi ya!', status: false });
  }
};
