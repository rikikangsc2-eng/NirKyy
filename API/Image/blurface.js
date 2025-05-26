const axios = require('axios');

module.exports = async function(req, res) {
  try {
    const imageUrl = req.query.url

    if (!imageUrl) {
      return res.errorJson('URL-nya mana, bos?', 400)
    }

    const response = await axios.get(`https://nirkyy-api.hf.space/api/blurface?url=${imageUrl}`, {
      responseType: 'stream'
    })

    res.setHeader('Content-Type', 'image/jpeg')
    response.data.pipe(res)
  } catch (e) {
    res.errorJson('Waduh, gagal nih ngambil gambarnya, coba lagi deh!', 500)
  }
}

