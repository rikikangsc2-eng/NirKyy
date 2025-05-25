const axios = require('axios')

module.exports = async function(req, res) {
  try {
    const inputText = req.query.text
    if (!inputText) {
      return res.errorJson('Waduh, teksnya kok kosong sih? Isi dulu dong!', 400)
    }

    const apiUrl = `https://nirkyy-api.hf.space/api/brat?text=${encodeURIComponent(inputText)}`

    const response = await axios.get(apiUrl, { responseType: 'stream' })

    res.setHeader('Content-Type', 'image/jpeg')
    response.data.pipe(res)
  } catch (e) {
    res.errorJson('Yah, gagal nih ngambil gambarnya. Coba lagi ya!', 500)
  }
}