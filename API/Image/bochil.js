const axios = require('axios')
module.exports = async function(req, res) {
  try {
    const nama = req.query.nama

    if (!nama) {
      return res.errorJson('Nama ga ada, bro!', 400)
    }

    const apiUrl = `https://nirkyy-api.hf.space/api/bochil?name=${encodeURIComponent(nama)}`

    const response = await axios.get(apiUrl, { responseType: 'stream' })

    if (response.headers['content-type'] && response.headers['content-type'].startsWith('image/')) {
      res.setHeader('Content-Type', response.headers['content-type'])
      response.data.pipe(res)
    } else {
      res.errorJson('Bukan gambar, cuy!', 500)
    }
  } catch (e) {
    if (e.response) {
      res.errorJson(`API-nya lagi ngambek: ${e.response.status}`, e.response.status)
    } else if (e.request) {
      res.errorJson('Jaringan putus, coba lagi nanti!', 503)
    } else {
      res.errorJson('Ada yang eror nih, pusing!', 500)
    }
  }
}

