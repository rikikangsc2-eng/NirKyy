const axios = require('axios');
const FormData = require('form-data');

module.exports = async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.errorJson({ error: 'URL parameter is required' }, 400);
    }

    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageResponse.data);

    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: 'image.jpeg', 
      contentType: 'image/jpeg',
    });

    const apiResponse = await axios.post(
      'https://ai-api.magicstudio.com/api/remove-background',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Accept': 'application/json, text/plain, */*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
          'Origin': 'https://magicstudio.com',
          'Referer': 'https://magicstudio.com/background-remover/editor/',
          'Sec-Ch-Ua': '"Not A(Brand";v="8", "Chromium";v="132"',
          'Sec-Ch-Ua-Mobile': '?1',
          'Sec-Ch-Ua-Platform': '"Android"',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36'
        },
        responseType: 'arraybuffer' // Menambahkan responseType arraybuffer
      }
    );

    // Langsung mengirimkan arraybuffer sebagai respons tanpa perlu mengubah ke stream
    res.setHeader('Content-Type', 'image/png'); // Asumsi API mengembalikan PNG transparan
    res.send(Buffer.from(apiResponse.data)); 

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.errorJson({ error: 'Internal Server Error', details: error.message });
  }
};
