const axios = require('axios')
const FormData = require('form-data')
const crypto = require('crypto')

module.exports = async function(req, res) {
  try {
    const imageUrl = req.query.url

    if (!imageUrl) {
      return res.errorJson('Mana nih link gambarnya? Nggak ada cuy!', 400)
    }

    const username = `${crypto.randomBytes(8).toString('hex')}_aiimglarger`
    const scale = req.query.scale || 4

    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer'
    })
    const imageBuffer = imageResponse.data
    const imageName = imageUrl.split('/').pop().split('?')[0] || 'temp.jpg'

    const formData = new FormData()
    formData.append('type', 0)
    formData.append('username', username)
    formData.append('scaleRadio', scale.toString())
    formData.append('file', imageBuffer, {
      filename: imageName,
      contentType: 'image/jpeg'
    })

    const uploadResponse = await axios.post('https://photoai.imglarger.com/api/PhoAi/Upload', formData, {
      headers: {
        ...formData.getHeaders(),
        'User-Agent': 'Dart/3.5 (dart:io)',
        'Accept-Encoding': 'gzip',
      },
    })

    const {
      code
    } = uploadResponse.data.data

    const pollParams = {
      code: code,
      type: 0,
      username: username,
      scaleRadio: scale.toString()
    }

    let statusData = null
    for (let i = 0; i < 100; i++) {
      const statusResponse = await axios.post('https://photoai.imglarger.com/api/PhoAi/CheckStatus', JSON.stringify(pollParams), {
        headers: {
          'User-Agent': 'Dart/3.5 (dart:io)',
          'Accept-Encoding': 'gzip',
          'Content-Type': 'application/json',
        },
      })
      statusData = statusResponse.data.data

      if (statusData.status === 'success') {
        break
      }
      if (statusData.status === 'failed') {
        throw new Error('Proses upscale gagal di server.')
      }
      await new Promise(r => setTimeout(r, 1000)) 
    }

    if (statusData && statusData.status === 'success' && statusData.downloadUrls && statusData.downloadUrls.length > 0) {
    const downloadUrl = statusData.downloadUrls[0]
    
     axios.get(downloadUrl, {responseType:"arraybuffer"}).then(imageResult => {
       res.setHeader('Content-Type','image/jpeg')
       res.send(Buffer.from(imageResult.data))
     }).catch(error => {
       res.errorJson("Gagal pas kirim gambar: "+error.message)
     })
    } else {
      throw new Error('Waduh, gambarnya nggak kelar di-upscale nih setelah ditungguin lama.')
    }

  } catch (e) {
    res.errorJson(e.message || 'Ada error nih pas proses gambarnya, coba lagi ya.')
  }
}
