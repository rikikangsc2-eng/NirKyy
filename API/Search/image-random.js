const axios = require('axios');
const cheerio = require('cheerio');
const url = require('url');

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function errorJson(res, message, status) {
  return res.status(status).json({ error: message });
}

module.exports = async function(req, res) {
  try {
    const query = req.query.query;
    if (!query) {
      return errorJson(res, 'Parameter "query" nya kosong nih, bre!', 400);
    }

    const targetUrl = `https://images.search.yahoo.com/search/images?p=${encodeURIComponent(query)}&ei=UTF-8&fr2=p%3As%2Cv%3Ai%2Cm%3Asb-top&tab=organic`;

    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.7049.111 Safari/537.36',
        'Referer': targetUrl
      }
    });

    const $ = cheerio.load(response.data);
    let images = [];

    $('#sres > li.ld > a').each((i, el) => {
      const href = $(el).attr('href');
      if (href) {
        try {
          const parsedUrl = url.parse(href, true);
          let imageUrl = parsedUrl.query.imgurl ? decodeURIComponent(parsedUrl.query.imgurl) : null;

          if (imageUrl) {
            if (!imageUrl.startsWith('https://')) {
              if (imageUrl.startsWith('http://')) {
                 imageUrl = imageUrl.replace('http://', 'https://');
              } else {
                 imageUrl = 'https://' + imageUrl;
              }
            }
            images.push({ imageUrl: imageUrl });
          }
        } catch (parseError) {
          // Do nothing on parse error
        }
      }
    });

    if (images.length === 0) {
      return errorJson(res, 'Yah, nggak nemu gambar nih buat kata kunci itu, cuy!', 404);
    }

    images = shuffleArray(images);

    let successful = false;
    for (const imageObj of images) {
      const selectedImageUrl = imageObj.imageUrl;
      try {
        const imageResponse = await axios({
          method: 'get',
          url: selectedImageUrl,
          responseType: 'arraybuffer', // Changed to arraybuffer
          timeout: 5000,
          headers: {
            'Accept': 'image/jpeg, image/png, image/gif',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.7049.111 Safari/537.36',
            'Referer': targetUrl
          }
        });

        if (imageResponse.status === 200 && imageResponse.headers['content-type']?.startsWith('image/')) {
          res.setHeader('Content-Type', imageResponse.headers['content-type']);
          res.send(Buffer.from(imageResponse.data)); // Send as Buffer
          successful = true;
          break;
        }
      } catch (fetchError) {
        // Do nothing on fetch error, try next image
      }
    }

    if (!successful) {
        return errorJson(res, 'Waduh, nggak ada satupun gambar yang bisa diambil nih dari daftar, bre!', 500);
    }

  } catch (e) {
    return errorJson(res, 'Ada masalah di awal nih pas operasi, cuy!', 500);
  }
};
