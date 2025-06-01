const axios = require('axios');

module.exports = async (req, res) => {
  const nama = req.query.nama;

  if (!nama) {
    return res.errorJson({ error: "Parameter 'nama' harus disediakan." }, 400);
  }

  try {
    const apiUrl = `https://nirkyy-api.hf.space/api/khodam?name=${encodeURIComponent(nama)}`;
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    res.setHeader('Content-Type', 'image/jpeg');
    res.send(Buffer.from(response.data));
  } catch (error) {
    console.error("Error fetching or sending khodam image:", error);
    res.errorJson({ error: "Gagal mengambil atau mengirim gambar khodam." });
  }
};
