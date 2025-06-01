const axios = require('axios')

module.exports = async function(req, res) {
  try {
    const inputText = req.query.text
    if (!inputText) {
      return res.errorJson('Waduh, teksnya kok kosong sih? Isi dulu dong!', 400)
    }

    const apiUrl = `https://nirkyy-api.hf.space/api/brat?text=${encodeURIComponent(inputText)}`

    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' })

    res.setHeader('Content-Type', 'image/png')
    res.send(response.data)
  } catch (e) {
    res.errorJson('Yah, gagal nih ngambil gambarnya. Coba lagi ya!', 500)
  }
}
