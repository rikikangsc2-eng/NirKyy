const axios = require('axios');

module.exports = async (req, res) => {
  const videoUrl = req.query.url;
  if (!videoUrl) {
    return res.errorJson('URL YouTube-nya mana cuy?', 400);
  }

  try {
    const headers = {
      'Accept': 'application/json, audio/*;q=0.8, text/plain, */*;q=0.1',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      'Content-Type': 'application/json',
      'DNT': '1',
      'Pragma': 'no-cache',
      'Referer': 'https://www.clipto.com/id/media-downloader/youtube-audio-downloader',
      'Sec-Ch-Ua': '"Not.A/Brand";v="99", "Chromium";v="135", "Google Chrome";v="135"',
      'Sec-Ch-Ua-Mobile': '?1',
      'Sec-Ch-Ua-Platform': '"Android"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.7049.100 Mobile Safari/537.36'
    };

    const csrfApi = 'https://www.clipto.com/api/csrf';

    const csrfRes = await axios.get(csrfApi, {
      headers: {
        ...headers
      }
    });

    const csrfToken = csrfRes.data?.csrfToken;
    if (!csrfToken) {
      return res.errorJson('CSRF token-nya kagak ada cuy', 500);
    }

    const encodedUrl = encodeURIComponent(videoUrl);
    const finalApi = `https://www.clipto.com/api/youtube/mp3?url=${encodedUrl}&csrfToken=${csrfToken}`;
    res.successJson(finalApi);
  } catch (err) {
    res.errorJson('Waduh, error pas ngakses API cuy', 500);
  }
};
