const axios = require('axios');
const cheerio = require('cheerio');
const { URLSearchParams } = require('url');

module.exports = async (req, res) => {
  const { link, text } = req.query;

  if (!link || !text) {
    return res.errorJson('Missing required query parameters: link and text', 400);
  }

  const defaultDeviceId = '31fe04f1-c5c9-4b40-b624-feb541551db2';
  let deviceId = defaultDeviceId;
  let username;

  try {
    const urlObject = new URL(link);
    username = urlObject.pathname.substring(1);
    if (!username) {
      throw new Error('Could not extract username from link');
    }
  } catch (error) {
    return res.errorJson(`Invalid link format: ${error.message}`, 400);
  }

  try {
    const getDeviceIdHeaders = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
      'Referer': link,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?1',
      'Sec-Ch-Ua-Platform': '"Android"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    };

    const deviceIdResponse = await axios.get(link, { headers: getDeviceIdHeaders });
    const $ = cheerio.load(deviceIdResponse.data);
    const extractedDeviceId = $('input#deviceId').val();

    if (extractedDeviceId) {
      deviceId = extractedDeviceId;
    }

    const submitHeaders = {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Accept': '*/*',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
      'Referer': link,
      'Origin': 'https://ngl.link',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?1',
      'Sec-Ch-Ua-Platform': '"Android"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin'
    };

    const payload = new URLSearchParams({
      username: username,
      question: text,
      deviceId: deviceId,
      gameSlug: '',
      referrer: ''
    });

    const submitResponse = await axios.post('https://ngl.link/api/submit', payload.toString(), { headers: submitHeaders });

    res.successJson(submitResponse.data);

  } catch (error) {
    let errorMessage = error.message;
    let status = 500;
    if (error.response) {
      status = error.response.status;
      errorMessage = `NGL API Error: ${error.response.status} ${error.response.statusText}`;
      if (error.response.data && typeof error.response.data === 'object') {
        errorMessage += ` - ${JSON.stringify(error.response.data)}`;
      } else if (error.response.data) {
        errorMessage += ` - ${error.response.data}`;
      }
    } else if (error.request) {
      errorMessage = 'No response received from NGL server.';
    }
    res.errorJson(errorMessage, status);
  }
};
