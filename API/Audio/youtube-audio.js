const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    const { url: youtubeUrl } = req.query;

    if (!youtubeUrl) {
      return res.errorJson("Parameter 'url' diperlukan", 400);
    }

    if (!/^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/.test(youtubeUrl)) {
      return res.errorJson("Parameter 'url' harus berupa URL YouTube yang valid", 400);
    }

    const initialUrl = 'https://ytmp3.ing/';
    const audioUrl = 'https://ytmp3.ing/audio';
    const userAgent = 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36';

    const initialResponse = await axios.get(initialUrl, {
      headers: {
        'User-Agent': userAgent,
        'Referer': initialUrl,
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
      }
    });

    const $ = cheerio.load(initialResponse.data);
    const csrfToken = $('form.download-form input[name="csrfmiddlewaretoken"]').val();

    if (!csrfToken) {
      return res.errorJson("Tidak dapat menemukan csrfmiddlewaretoken", 500);
    }

    const cookies = initialResponse.headers['set-cookie'];
    let cookieString = '';
    if (cookies) {
      cookieString = cookies.map(cookie => cookie.split(';')[0]).join('; ');
    }

    const payload = new URLSearchParams();
    payload.append('url', youtubeUrl);

    const audioResponse = await axios.post(audioUrl, payload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-CSRFToken': csrfToken,
        'User-Agent': userAgent,
        'Referer': initialUrl,
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': '*/*',
        'Origin': 'https://ytmp3.ing',
        'Cookie': cookieString
      },
      responseType: 'json'
    });

    if (!audioResponse.data || !audioResponse.data.url || !audioResponse.data.filename) {
      return res.errorJson("Respons tidak valid dari API audio", 500);
    }

    const encodedUrl = audioResponse.data.url;
    const filename = audioResponse.data.filename;

    const decodedUrl = Buffer.from(encodedUrl, 'base64').toString('utf-8');

    res.successJson({ decodedUrl, filename });

  } catch (error) {
    let errorMessage = error.message;
    let status = 500;
    if (error.response) {
      status = error.response.status;
      errorMessage = `Error ${error.response.status}: ${error.response.statusText || 'Gagal mengambil data'}`;
      if (error.response.data && typeof error.response.data === 'object') {
        errorMessage += ` - ${JSON.stringify(error.response.data)}`;
      } else if (error.response.data) {
        errorMessage += ` - ${error.response.data}`;
      }
    } else if (error.request) {
      errorMessage = "Tidak ada respons dari server";
    }
    res.errorJson(errorMessage, status);
  }
};
