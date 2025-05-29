const axios = require('axios')

module.exports = async function(req, res) {
  try {
    const response = await axios.get('https://raw.githubusercontent.com/rikikangsc2-eng/database/refs/heads/main/game-islamic.json')
    const data = response.data
    if (!Array.isArray(data) || data.length === 0) {
      return res.errorJson('Yah, datanya kosong nih!', 404)
    }
    const randomIndex = Math.floor(Math.random() * data.length)
    const randomItem = data[randomIndex]
    res.successJson(randomItem)
  } catch (e) {
    if (e.response) {
      res.errorJson(`Gagal narik data dari server nih: ${e.response.status}`, e.response.status)
    } else if (e.request) {
      res.errorJson('Gak ada respons dari server, koneksi kamu kenapa tuh?', 503)
    } else {
      res.errorJson(`Ada yang salah nih: ${e.message}`, 500)
    }
  }
}
