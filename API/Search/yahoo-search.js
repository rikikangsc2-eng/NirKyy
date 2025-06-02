const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
  const query = req.query.q;
  if (!query) return res.errorJson('Parameter "q" tidak ditemukan.', 400);
  
  const searchUrl = `https://id.search.yahoo.com/search?p=${encodeURIComponent(query)}`;
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
    'Referer': searchUrl
  };
  
  try {
    const { data: html } = await axios.get(searchUrl, {
      headers,
      timeout: 15000,
      responseType: 'text',
      decompress: true
    });
    
    const $ = cheerio.load(html);
    const results = [];
    
    $('section.algo-sr').each((_, el) => {
      const titleEl = $(el).find('h3 a').first();
      const descEl = $(el).find('.compText p').first();
      let title = titleEl.text().trim();
      let rawUrl = titleEl.attr('href') || '';
      let description = descEl.text().trim();
      let finalUrl = rawUrl;
      
      try {
        const urlObj = new URL(rawUrl);
        const ru = urlObj.searchParams.get('RU') || urlObj.searchParams.get('ru');
        if (ru) finalUrl = decodeURIComponent(ru);
      } catch (e) {
        // Keep rawUrl if parsing fails
      }
      
      if (title && finalUrl && description) {
        results.push({
          title,
          url: finalUrl,
          description
        });
      }
    });
    
    if (results.length === 0) {
      return res.errorJson('Tidak ada hasil ditemukan dalam struktur yang diharapkan.', 404);
    }
    
    res.successJson({ results });
  } catch (err) {
    const message = `Gagal mengambil data dari Yahoo Search. ${err.message}`;
    res.errorJson(message, err.response?.status || 500);
  }
};