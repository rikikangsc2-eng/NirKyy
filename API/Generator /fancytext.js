const axios = require('axios');
const cheerio = require('cheerio');
const { URLSearchParams } = require('url');

module.exports = async (req, res) => {
    try {
        const { text } = req.query;

        if (!text) {
            return res.errorJson('Parameter text is required', 400);
        }

        const csrfUrl = 'https://www.fancytextpro.com/FancyTextGenerator/CoolText';
        const userAgent = 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36';
        const referer = 'https://www.fancytextpro.com/';

        const csrfResponse = await axios.get(csrfUrl, {
            headers: {
                'User-Agent': userAgent,
                'Referer': referer
            }
        });

        const $ = cheerio.load(csrfResponse.data);
        const csrfToken = $('#csrf').val() || '';

        const generateUrl = 'https://www.fancytextpro.com/generate';
        const payload = new URLSearchParams();
        payload.append('text', text);
        payload.append('_csrf', csrfToken);
        payload.append('pages[]', 'New');
        payload.append('pages[]', 'Unique');
        payload.append('pages[]', 'CoolText');


        const generateResponse = await axios.post(generateUrl, payload.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Accept': 'text/plain, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest',
                'User-Agent': userAgent,
                'Referer': referer,
            }
        });

        res.successJson(generateResponse.data);

    } catch (error) {
        let errorMessage = error.message;
        if (error.response) {
             errorMessage = `Error ${error.response.status}: ${error.response.statusText}`;
             if (error.response.data) {
                 errorMessage += ` - ${JSON.stringify(error.response.data)}`;
             }
        } else if (error.request) {
            errorMessage = 'Error: No response received from server.';
        }
        res.errorJson(errorMessage, 500);
    }
};
