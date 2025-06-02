const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  try {
    const url = 'https://www.gramedia.com/best-seller/kata-kata-bijak-anime/';
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
      'Referer': url
    };

    const response = await axios.get(url, { headers });
    const $ = cheerio.load(response.data);

    const quotes = [];
    $('li[style="font-weight: 400;"][aria-level="1"]').each((index, element) => {
      quotes.push($(element).text().trim());
    });

    if (quotes.length === 0) {
      return res.errorJson('No matching quotes found.', 200);
    }

    const randomIndex = Math.floor(Math.random() * quotes.length);
    const randomQuote = quotes[randomIndex];

    res.successJson(randomQuote);

  } catch (error) {
    res.errorJson(error.message, 500);
  }
};
