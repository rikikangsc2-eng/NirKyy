const axios = require('axios');

module.exports = async (req, res) => {
  const prompt = req.query.prompt;
  const aspectRatio = req.query.aspect_ratio || '1:1';
  const link = 'writecream.com';

  if (!prompt) {
    return res.errorJson('Mana promptnya? Mau bikin gambar apa sih?', 400);
  }

  const apiUrl = `https://1yjs1yldj7.execute-api.us-east-1.amazonaws.com/default/ai_image?prompt=${encodeURIComponent(prompt)}&aspect_ratio=${encodeURIComponent(aspectRatio)}&link=${encodeURIComponent(link)}`;

  try {
    const apiResponse = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.7049.111 Mobile Safari/537.36',
        'Referer': apiUrl
      }
    });

    const imageLink = apiResponse.data.image_link;

    if (!imageLink) {
      return res.errorJson('Duh, link gambarnya nggak ada di respons API. Aneh.', 500);
    }

    const imageResponse = await axios.get(imageLink, {
      responseType: 'arraybuffer' 
    });

    res.setHeader('Content-Type', 'image/jpeg');
    res.send(Buffer.from(imageResponse.data));

  } catch (e) {
    if (e.response && e.response.status) {
      if (e.response.status >= 400 && e.response.status < 500) {
        return res.errorJson(`API-nya protes nih, status: ${e.response.status}. Cek lagi deh prompt atau parameternya.`, e.response.status);
      } else {
        return res.errorJson(`Duh, gagal nyari link gambarnya nih. Server API-nya lagi ngambek kali, status: ${e.response.status}.`, e.response.status);
      }
    } else if (e.request) {
      return res.errorJson('Permintaan ke API-nya nggak nyampe. Koneksi internet lu kali yang jelek?', 500);
    } else {
      return res.errorJson('Ada error aneh pas mau ngambil gambar. Coba lagi aja.', 500);
    }
  }
};
