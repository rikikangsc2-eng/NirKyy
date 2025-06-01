const axios = require('axios');

module.exports = async (req, res) => {
    try {
        const text = req.query.text;
        if (!text) {
            return res.errorJson('Parameter text diperlukan', 400);
        }

        const apiUrl = 'https://www.flamingtext.com/net-fu/image_output.cgi';
        const params = {
            _comBuyRedirect: 'false',
            script: 'blue-fire',
            text: text,
            symbol_tagname: 'popular',
            fontsize: '70',
            fontname: 'futura_poster',
            fontname_tagname: 'cool',
            textBorder: '15',
            growSize: '0',
            antialias: 'on',
            hinting: 'on',
            justify: '2',
            letterSpacing: '0',
            lineSpacing: '0',
            textSlant: '0',
            textVerticalSlant: '0',
            textAngle: '0',
            textOutline: 'false',
            textOutlineSize: '2',
            textColor: '#0000CC',
            angle: '0',
            blueFlame: 'false',
            frames: '5',
            pframes: '5',
            oframes: '4',
            distance: '2',
            transparent: 'false',
            extAnim: 'gif',
            animLoop: 'on',
            defaultFrameRate: '75',
            doScale: 'off',
            scaleWidth: '240',
            scaleHeight: '120',
            _: Date.now()
        };

        const headers = {
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
            'Referer': 'https://www.flamingtext.com/net-fu/dynamic.cgi?script=blue-fire'
        };

        const apiResponse = await axios.get(apiUrl, { params, headers });

        if (apiResponse.data && apiResponse.data.src) {
            const imageUrl = apiResponse.data.src;
            const imageResponse = await axios({
                method: 'get',
                url: imageUrl,
                responseType: 'arraybuffer',
                headers: {
                    'User-Agent': headers['User-Agent'],
                    'Referer': apiUrl
                }
            });
            res.setHeader('Content-Type', 'image/gif');
            res.send(imageResponse.data);
        } else {
            return res.errorJson(new Error('Gagal mendapatkan URL gambar dari API FlamingText'), 500);
        }

    } catch (error) {
        return res.errorJson(error, 500);
    }
};
