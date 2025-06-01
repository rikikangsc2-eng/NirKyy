const axios = require('axios');

const errorJson = (res, message, status = 500) => res.errorJson(message, status);

module.exports = (req, res) => {
  const text = req.query.q;
  if (!text) return errorJson(res, 'Waduh, parameter "q" (query) nya mana, Cuy? Contohnya nih: /play?q=dj komang', 400);

  axios.get(`https://pursky.vercel.app/api/ytplay?q=${text}`)
    .then(response => {
      if (!response.data || !response.data.audio) return errorJson(res, 'Gagal ngambil link audio dari API eksternal nih, Bre. Coba lagi ya!', 500);
      const { audio } = response.data;
      const headers = response.data.note?.headers || {};
      return axios({
        method: 'get',
        url: audio,
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': headers['User-Agent'] || 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.7049.100 Mobile Safari/537.36',
          'Referer': headers['Referer'] || audio
        }
      });
    })
    .then(audioResponse => {
      const filename = text.replace(/\s+/g, '_');
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="${filename}.mp3"`,
        'Content-Length': audioResponse.data.length
      });
      res.end(Buffer.from(audioResponse.data));
    })
    .catch(error => {
      console.error('Error fetching or streaming audio:', error.message);
      if (error.response) errorJson(res, `API eksternalnya ngasih error nih, Bre: ${error.response.statusText || error.message}`, error.response.status);
      else if (error.request) errorJson(res, 'Nggak ada respons dari API eksternal nih, Cuy.', 500);
      else errorJson(res, `Ada error internal nih: ${error.message}`, 500);
    });
};
