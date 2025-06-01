const axios = require('axios');

module.exports = async (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) {
    return res.errorJson('Isi prompt-nya dulu, cuy!', 400);
  }

  const baseURLs = [
    'https://elevenlabs-crack.vercel.app',
    'https://elevenlabs-crack-f2zu.vercel.app',
    'https://elevenlabs-crack-qyb7.vercel.app'
  ];

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
    'Referer': 'https://elevenlabs-crack.vercel.app/'
  };

  let tries = 0;
  let maxTries = 3;
  let imageUrl = null;
  let lastError = null;

  while (tries < maxTries && !imageUrl) {
    const shuffled = baseURLs.sort(() => 0.5 - Math.random());
    const baseURL = shuffled[0];

    try {
      const response = await axios.post(`${baseURL}/generate-image`, {
        prompt: prompt
      }, { headers });

      if (response.data && response.data.imageUrl) {
        imageUrl = response.data.imageUrl;
        break;
      } else {
        throw new Error('Gagal dapetin URL gambar, cuy.');
      }
    } catch (err) {
      lastError = err;
      tries++;
    }
  }

  if (imageUrl) {
    try {
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      res.set('Content-Type', 'image/jpeg');
      res.send(Buffer.from(imageResponse.data));
    } catch (err) {
      res.errorJson(`Gagal ngambil gambar, cuy. Error: ${err.message}`, 500);
    }
  } else {
    res.errorJson(`Gagal terus dapetin gambar, cuy. Coba lagi nanti. Error terakhir: ${lastError.message}`, 500);
  }
};
