const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { prompt } = req.query;
    if (!prompt) return res.errorJson('Missing prompt', 400);

    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const body = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="prompt"\r\n',
      prompt,
      `--${boundary}`,
      'Content-Disposition: form-data; name="output_format"\r\n',
      'bytes',
      `--${boundary}`,
      'Content-Disposition: form-data; name="anonymous_user_id"\r\n',
      'null',
      `--${boundary}`,
      'Content-Disposition: form-data; name="user_id"\r\n',
      'ba70f96a-04ca-4bed-96df-263258f18ef1',
      `--${boundary}`,
      'Content-Disposition: form-data; name="request_timestamp"\r\n',
      `${Date.now() / 1000}`,
      `--${boundary}`,
      'Content-Disposition: form-data; name="user_is_subscribed"\r\n',
      'false',
      `--${boundary}`,
      'Content-Disposition: form-data; name="client_id"\r\n',
      'none',
      `--${boundary}--`
    ].join('\r\n');

    const response = await axios({
      method: 'post',
      url: 'https://ai-api.magicstudio.com/api/ai-art-generator',
      data: Buffer.from(body), // Mengubah string body menjadi Buffer
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Origin': 'https://magicstudio.com',
        'Referer': 'https://magicstudio.com/',
        'User-Agent': 'Mozilla/5.0'
      },
      responseType: 'arraybuffer' // Mengganti responseType menjadi 'arraybuffer'
    });

    res.setHeader('Content-Type', 'image/jpeg');
    res.send(Buffer.from(response.data)); // Mengirimkan data sebagai Buffer dari ArrayBuffer

  } catch (error) {
    res.errorJson('Error generating image');
  }
};
