const axios = require('axios');
const cheerio = require('cheerio');
const { URLSearchParams } = require('url');

module.exports = async (req, res) => {
  const baseUrls = [
    'https://elevenlabs-crack.vercel.app',
    'https://elevenlabs-crack-qyb7.vercel.app',
    'https://elevenlabs-crack-f2zu.vercel.app'
  ];

  const text = req.query.text;
  let model = req.query.model;

  if (!text) {
    return res.errorJson('Missing text parameter');
  }

  for (let i = 0; i < 3; i++) {
    const baseUrl = baseUrls[Math.floor(Math.random() * baseUrls.length)];

    try {
      if (!model || model === "getList") {
        const { data: html } = await axios.get(baseUrl + '/');
        const $ = cheerio.load(html);
        const options = $('#ttsForm select[name="model"] option').map((_, el) => $(el).val()).get();
        return res.successJson({ models: options });
      }

      const payload = new URLSearchParams();
      payload.append('model', model);
      payload.append('text', text);

      const response = await axios.post(`${baseUrl}/generate-audio`, payload.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
          'Referer': baseUrl + '/'
        },
        responseType: 'arraybuffer' 
      });

      res.set({
        'Content-Type': response.headers['content-type'],
        'Content-Length': response.headers['content-length']
      });

      return res.send(Buffer.from(response.data));

    } catch (e) {}
  }

  res.errorJson('Mungkin model Tidak tersedia Atau tunggu beberapa menit untuk mencoba lagi, jika berlanjut hubungi PurPur', 500);
};
