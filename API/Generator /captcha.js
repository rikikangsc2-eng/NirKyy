const axios = require('axios')

module.exports = async function(req, res) {
  try {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    const numbers = '123456789'
    let token = ''

    for (let i = 0; i < 3; i++) {
      token += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    for (let i = 0; i < 2; i++) {
      token += numbers.charAt(Math.floor(Math.random() * numbers.length))
    }

    const data = {
      token: token,
      image: "https://puru-jet.vercel.app/captcha?text=" + token
    }

    res.successJson(data)

  } catch (e) {
    res.errorJson('Waduh, gagal bikin captcha nih!', 500)
  }
}

