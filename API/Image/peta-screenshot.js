const axios = require('axios')
const cheerio = require('cheerio')

module.exports = async function(req, res) {
  try {
    const lokasi = req.query.lokasi

    if (!lokasi) {
      return res.errorJson('Lokasi gak ada, bro!', 400)
    }

    const apiUrl = `https://nirkyy-api.hf.space/api/ssmap?lokasi=${encodeURIComponent(lokasi)}`
    const response = await axios.get(apiUrl)

    const base64Image = response.data.screenshot
    if (!base64Image || !base64Image.startsWith('data:image/png;base64,')) {
      return res.errorJson('Data gambar gak valid, nih!', 500)
    }

    const base64Data = base64Image.replace(/^data:image\/png;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    res.setHeader('Content-Type', 'image/png')
    res.send(imageBuffer)

  } catch (e) {
    res.errorJson('Gagal ambil gambar, nih!', 500)
  }
}

