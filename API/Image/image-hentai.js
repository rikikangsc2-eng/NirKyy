const axios = require('axios');

module.exports = async (req, res) => {
  const ajaxUrl = 'https://aihentai.co/wp-admin/admin-ajax.php';
  const postData = 'action=get_random_image_url';
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.7049.111 Mobile Safari/537.36',
    'Referer': 'https://aihentai.co/random/'
  };

  let imageUrl = null;
  const maxAttempts = 10;
  let attempts = 0;

  while (!imageUrl && attempts < maxAttempts) {
    attempts++;
    try {
      const ajaxResponse = await axios.post(ajaxUrl, postData, { headers });
      const responseData = ajaxResponse.data;

      if (typeof responseData === 'string') {
         if (responseData.startsWith('http')) {
             imageUrl = responseData.trim();
         }
      } else if (typeof responseData === 'object') {
          if (responseData.url && typeof responseData.url === 'string' && responseData.url.startsWith('http')) {
              imageUrl = responseData.url.trim();
          } else if (responseData.data && typeof responseData.data.url === 'string' && responseData.data.url.startsWith('http')) {
              imageUrl = responseData.data.url.trim();
          }
      }

      if (!imageUrl) {
          await new Promise(resolve => setTimeout(resolve, 500));
      }

    } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (!imageUrl) {
    return res.errorJson('Failed to obtain image URL after multiple attempts.', 500);
  }

  try {
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const contentType = imageResponse.headers['content-type'];

    if (!contentType || !contentType.startsWith('image/')) {
      return res.errorJson('URL did not provide an image.', 500);
    }

    res.setHeader('Content-Type', contentType);
    res.end(Buffer.from(imageResponse.data));

  } catch (error) {
    res.errorJson('Failed to fetch image.', 500);
  }
};
