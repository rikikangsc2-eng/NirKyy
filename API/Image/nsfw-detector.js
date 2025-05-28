const axios = require('axios')
const cheerio = require('cheerio')

module.exports = async function(req, res) {
  try {
    const imageUrl = req.query.url
    if (!imageUrl) {
      return res.errorJson('Mana nih URL-nya, bos?', 400)
    }

    const apiKeys = [
      'sk_ce597f871647cebb433d41f7366a05ba7740503736fe737fd57a2d1ad15823b3c6fe9dd70ed608aa2f3e75768857cfe9c46e6d27ed5b4f8c59f5d68ae492afc2024N78OMedexlCJ3ZwIAu',
      'sk_6da72b60fd3959bb3546b217a7ef104cc1bfb73fb3f0e2a6fadb93db20901b9f5f183416c5d7d9e7c04630eff5197319c33a6443e147b9ad55d092791705e24a024ijaZl0xwOxQGOF7wFM'
    ]
    const randomApiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)]

    const response = await axios.post(
      'https://api.jigsawstack.com/v1/validate/nsfw',
      { url: imageUrl },
      { headers: { 'x-api-key': randomApiKey } }
    )

    res.successJson(response.data)
  } catch (e) {
    if (e.response && e.response.status) {
      if (e.response.status === 401) {
        return res.errorJson('API Key-nya gak valid, Bray!', 401)
      }
      if (e.response.status === 403) {
        return res.errorJson('Akses ditolak, mungkin URL-nya bermasalah?', 403)
      }
      if (e.response.status === 429) {
        return res.errorJson('Kebanyakan request nih, santai dulu!', 429)
      }
      return res.errorJson(`Ada masalah dari server eksternal: ${e.response.statusText || 'Gak tau deh errornya kenapa.'}`, e.response.status)
    }
    res.errorJson('Yah, gagal scraping nih, coba lagi nanti ya!', 500)
  }
}
