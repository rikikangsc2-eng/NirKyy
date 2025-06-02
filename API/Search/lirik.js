const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.errorJson({ error: 'Parameter q (query) diperlukan.' }, 400);
    }

    const url = `https://www.lyrics.com/lyrics/${encodeURIComponent(query)}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
                'Referer': `https://www.lyrics.com/lyrics/${encodeURIComponent(query)}`,
            },
            decompress: true,
        });

        const htmlContent = response.data;
        const $ = cheerio.load(htmlContent);
        const lyricDiv = $('.sec-lyric.clearfix').first();
        const lyricBody = lyricDiv.find('.lyric-body').text().trim();

        if (lyricBody) {
            res.successJson({ lyrics: lyricBody });
        } else {
            res.errorJson({ error: 'Lirik tidak ditemukan.' }, 404);
        }
    } catch (error) {
        res.errorJson({ error: 'Terjadi kesalahan saat mengambil lirik.' });
    }
};
