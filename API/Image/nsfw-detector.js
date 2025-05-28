const axios = require('axios')

module.exports = async function(req, res) {
  try {
    const imageUrl = req.query.url

    if (!imageUrl) {
      return res.errorJson('URL gambar mana, bro?', 400)
    }

    const response = await axios.post(
      'https://jigsawstack.com/api/v1/validate/nsfw',
      { url: imageUrl },
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
          'Referer': 'https://jigsawstack.com/nsfw-detection',
        },
      }
    )

    const data = response.data

    if (data.success) {
      const formattedData = {
        success: data.success,
        nsfw: data.nsfw,
        nudity: data.nudity,
        gore: data.gore,
        nsfw_score_percent: (data.nsfw_score * 100).toFixed(2) + '%',
        nudity_score_percent: (data.nudity_score * 100).toFixed(2) + '%',
        gore_score_percent: (data.gore_score * 100).toFixed(2) + '%',
      }
      res.successJson(formattedData)
    } else {
      res.errorJson('Validasi gagal, nih. Ada apa ya?', 500)
    }
  } catch (e) {
    if (e.response) {
      res.errorJson(`Server Jigsawstack ngambek: ${e.response.status} - ${e.response.statusText || 'Gak jelas nih errornya'}`, e.response.status)
    } else if (e.request) {
      res.errorJson('Gak ada respons dari Jigsawstack. Koneksi putus kali?', 503)
    } else {
      res.errorJson('Ada yang error, tapi bukan di Jigsawstack. Cek lagi kodenya!', 500)
    }
  }
}

