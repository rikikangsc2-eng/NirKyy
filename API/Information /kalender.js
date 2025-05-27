const axios = require('axios')

module.exports = async function(req, res) {
  try {
    const url = 'https://nirkyy-api.hf.space/api/kalender'
    const response = await axios.get(url)
    res.successJson(response.data)
  } catch (e) {
    res.errorJson('Waduh, gagal ngambil data kalender nih!', 500)
  }
}
