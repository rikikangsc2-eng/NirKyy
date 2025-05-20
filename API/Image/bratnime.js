const axios = require('axios')

module.exports = async function(req, res) {
  try {
    const text = req.query.text

    if (!text) {
      return res.errorJson('Eh, teksnya mana nih? Gak ada isinya.', 400)
    }

    const url = `https://puru-jet.vercel.app/bratnime?text=${encodeURIComponent(text)}`

    const response = await axios({
      method: 'get',
      url: url,
      responseType: 'stream'
    })

    res.setHeader('Content-Type', 'image/jpeg')
    response.data.pipe(res)

  } catch (error) {
    res.errorJson('Yah, gagal ngambil gambar nih.', error.response ? error.response.status : 500)
  }
}
