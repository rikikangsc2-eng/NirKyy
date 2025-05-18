const axios = require('axios')

module.exports = async function(req, res) {
  try {
    const system = req.query.system
    const query = req.query.query

    if (!system || !query) {
      return res.errorJson('Parameter system atau query kosong nih, coba cek lagi ya!', 400)
    }

    const queryParam = JSON.stringify([
      { role: 'system', content: system },
      { role: 'user', content: query }
    ])

    const encodedQueryParam = encodeURIComponent(queryParam)

    const url = `https://8pe3nv3qha.execute-api.us-east-1.amazonaws.com/default/llm_chat?query=${encodedQueryParam}&link=writecream.com`

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
      'Referer': 'https://www.writecream.com/ai-chat/'
    }

    const response = await axios.get(url, { headers })

    if (response.data && response.data.response_content) {
      res.successJson({ mes: response.data.response_content })
    } else {
      res.errorJson('Yah, format responsenya gak sesuai harapan nih!', 500)
    }

  } catch (e) {
    res.errorJson('Yah, gagal ambil data nih!', 500)
  }
}

