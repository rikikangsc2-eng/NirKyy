const axios = require('axios')

module.exports = async function(req, res) {
  try {
    const prompt = req.query.prompt
    
    if (!prompt) {
      return res.errorJson('Parameter \'prompt\' wajib diisi, bro!', 400)
    }
    
    const apiUrl = `https://nirkyy-api.hf.space/api/animegine?prompt=${encodeURIComponent(prompt)}`
    
    const response = await axios.get(apiUrl, { responseType: 'stream' })
    
    res.setHeader('Content-Type', 'image/jpeg')
    response.data.pipe(res)
  } catch (e) {
    res.errorJson('Gagal ngambil gambar, coba lagi nanti ya!', 500)
  }
}