const axios = require('axios');

module.exports = async function(req, res) {
  const { url, prompt } = req.query;
  const apiUrl = 'https://fluxai.pro/api/images/edit';
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const response = await axios.post(apiUrl, {
        imageUrl: url,
        prompt: prompt,
        isAdvanced: false
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
          'Referer': 'https://fluxai.pro/ai-photo-editing'
        }
      });
      const imageUrl = response.data.imageUrl;
      const streamimagenya = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'stream',
      });
      
      res.set('Content-Type', 'image/jpeg');
      streamimagenya.data.pipe(res);
      return; 

    } catch (e) {
      attempts++;
      const status = e.response && e.response.status ? e.response.status : 500;

      if (status === 400) {
        return res.errorJson('Waduh, permintaan lo ada yang salah nih. Cek lagi deh URL atau prompt-nya!', 400);
      }

      if (attempts >= maxAttempts) {
        return res.errorJson(`Duh, udah dicoba ${maxAttempts} kali tapi masih error juga. Kayaknya ada masalah di sana deh.`, status);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};
