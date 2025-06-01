const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { url, type } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'Parameter "url" wajib diisi, bego!' });
    }

    const screenshotType = type === 'desktop' ? 'desktop' : 'phone';

    const screenshotApiUrl = `https://nirkyy-api.hf.space/api/ssweb?url=${encodeURIComponent(url)}&type=${screenshotType}`;

    const screenshotResponse = await axios.get(screenshotApiUrl, {
      responseType: 'arraybuffer'
    });

    const contentType = screenshotResponse.headers['content-type'];
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    } else {
      res.setHeader('Content-Type', 'image/png');
    }

    res.send(screenshotResponse.data);

  } catch (e) {
    console.error(`Ada error tolol di prosesnya: ${e.message}`);
    if (!res.headersSent) {
      res.status(e.response ? e.response.status : 500).json({ error: `Ada error tolol di prosesnya: ${e.message}` });
    }
  }
};
