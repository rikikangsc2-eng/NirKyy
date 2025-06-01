const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { type } = req.query;

    const allowedTypes = ['waifu', 'neko', 'cry', 'blush', 'cuddle', 'kiss'];
    if (!type || !allowedTypes.includes(type)) {
      return res.errorJson('Type-nya ga valid cuy! Pilih salah satu dari: ' + allowedTypes.join(', '), 400);
    }

    const apiUrl = `https://api.waifu.pics/sfw/${type}`;
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36',
        'Referer': 'https://random-image-v1.vercel.app/'
      }
    });

    const imageUrl = response.data.url;
    const imageResp = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const contentType = imageResp.headers['content-type'] || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.send(Buffer.from(imageResp.data));

  } catch (err) {
    console.error('Error cuy:', err.message);
    res.errorJson('Ada error cuy, coba lagi nanti!', 500);
  }
};
