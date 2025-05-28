const axios = require('axios')

module.exports = async function(req, res) {
  try {
    const imageUrl = req.query.url
    if (!imageUrl) {
      return res.errorJson('Parameter `url` gak ada, cuy!', 400)
    }

    const apiUrl = `https://nirkyy-api.hf.space/api/nsfw?url=${encodeURIComponent(imageUrl)}`
    const response = await axios.get(apiUrl)
    const { data } = response.data.data

    if (!data || data.success === false) {
      return res.errorJson('Gagal ngecek, bro!', 500)
    }

    const result = {
      isUnsafe: data.unsafe,
      detectedObjects: []
    }

    if (data.objects && data.objects.length > 0) {
      result.detectedObjects = data.objects.map(obj => ({
        label: obj.label,
        scorePercentage: (obj.score * 100).toFixed(2) + '%'
      }))
    }

    res.successJson(result)
  } catch (e) {
    if (e.response) {
      res.errorJson(`Server API-nya lagi ngadat: ${e.response.status}`, e.response.status)
    } else if (e.request) {
      res.errorJson('Gak ada respons dari server, internetnya kali?')
    } else {
      res.errorJson('Ada yang error nih pas scraping, coba lagi ya!')
    }
  }
}
