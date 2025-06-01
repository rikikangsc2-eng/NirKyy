const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const { text } = req.query;

    if (!text) {
      return res.errorJson('Parameter "text" is required', 400);
    }

    const params = {
      _comBuyRedirect: "false",
      script: "fire-logo",
      text: text,
      symbol_tagname: "popular",
      fontsize: "70",
      fontname: "Cry Uncial",
      fontname_tagname: "cool",
      textBorder: "20",
      growSize: "0",
      antialias: "on",
      hinting: "on",
      justify: "2",
      letterSpacing: "0",
      lineSpacing: "0",
      textSlant: "0",
      textVerticalSlant: "0",
      textAngle: "0",
      textOutline: "false",
      textOutlineSize: "2",
      textColor: "#000000",
      fireSize: "70",
      backgroundResizeToLayers: "on",
      backgroundRadio: "1",
      backgroundColor: "#000000",
      backgroundPattern: "Wood",
      backgroundPattern_tagname: "standard",
      backgroundGradient: "Web20 Blue 3D #10",
      backgroundGradient_tagname: "standard",
      backgroundGradientAngle: "180",
      backgroundGradientCenterX: "50",
      backgroundGradientCenterY: "50",
      backgroundStarburstColorAlt: "#ED2400",
      backgroundStarburstColor1: "#BD2409",
      backgroundStarburstNum: "25",
      backgroundStarburstRayPercentage: "50",
      backgroundStarburstUseColor2: "false",
      backgroundStarburstColor2: "#000000",
      backgroundStarburstOffsetAngle: "0",
      backgroundStarburstXOffset: "0",
      backgroundStarburstYOffset: "0",
      backgroundStarburstCenterPercentage: "2",
      backgroundStarburstRadiusX: "1000",
      backgroundStarburstRadiusY: "1000",
      backgroundStarburstCF1: "0",
      backgroundUseOverlay: "off",
      backgroundOverlayMode: "5",
      backgroundOverlayPattern: "Parque #1",
      backgroundOverlayPattern_tagname: "standard",
      backgroundOverlayOpacity: "100",
      backgroundImageUrl: "http://www.flamingtext.com/images/textures/texture3.jpg",
      useFixedSize: "false",
      imageWidth: "400",
      imageHeight: "150",
      imageAlignment: "4",
      autocrop: "false",
      autocropPadding: "0",
      watermark: "none",
      ext: "png",
      jpgQuality: "85",
      doScale: "off",
      scaleWidth: "240",
      scaleHeight: "120",
      _: Date.now()
    };

    const headers = {
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
      'Referer': 'https://www.flamingtext.com/logo/Design-Fire'
    };

    const response = await axios.get('https://www.flamingtext.com/net-fu/image_output.cgi', {
      params: params,
      headers: headers
    });

    const gambarResponse = await axios.get(response.data.src, { responseType: 'arraybuffer' });
    res.setHeader('Content-Type', 'image/png');
    res.send(gambarResponse.data);
  } catch (error) {
    let errorMessage = error.message;
    let status = 500;
    if (error.response) {
      status = error.response.status;
      errorMessage = `API Error: ${error.response.status} ${error.response.statusText}`;
      if (typeof error.response.data === 'string' && error.response.data.length < 200) {
        errorMessage += ` - ${error.response.data}`;
      }
    } else if (error.request) {
      errorMessage = 'API Error: No response received from server.';
    }
    res.errorJson(errorMessage, status);
  }
};
