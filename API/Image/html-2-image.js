const axios = require('axios')

module.exports = async function(req, res) {
  try {
    const htmlContent = req.query.html

    if (!htmlContent) {
      return res.errorJson('HTML-nya mana, bos?', 400)
    }

    const apiUrl = `https://nirkyy-api.hf.space/api/html-to-image?html=${encodeURIComponent(htmlContent)}`

    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' })

    res.setHeader('Content-Type', 'image/jpeg')
    res.send(Buffer.from(response.data))
  } catch (e) {
    res.errorJson('Waduh, gagal bikin gambarnya!', 500)
  }
}
