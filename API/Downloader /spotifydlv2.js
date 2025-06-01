const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function(req, res) {
  const userAgent = 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.125 Mobile Safari/537.36';
  const mainUrl = 'https://spotmate.online/en';
  const convertUrl = 'https://spotmate.online/convert';
  
  const { url: songUrl } = req.query;
  
  if (!songUrl) {
    return res.errorJson("Please provide the Spotify URL in the 'url' query parameter.", 400);
  }
  
  let sessionCookie = '';
  let csrfToken = '';
  
  try {
    const initialResponse = await axios.get(mainUrl, {
      headers: {
        'User-Agent': userAgent,
      }
    });
    
    const $ = cheerio.load(initialResponse.data);
    csrfToken = $('meta[name="csrf-token"]').attr('content');
    
    if (!csrfToken) {
      return res.errorJson("Couldn't find the CSRF token on the Spotmate page.", 500);
    }
    
    const allCookies = initialResponse.headers['set-cookie'];
    if (allCookies && Array.isArray(allCookies)) {
      sessionCookie = allCookies.map(cookie => cookie.split(';')[0]).join('; ');
    }
    
  } catch (error) {
    return res.errorJson("Failed to retrieve CSRF token or cookies from Spotmate. The server might be busy or there was an update.", 500);
  }
  
  let downloadLink;
  
  try {
    const postData = { urls: songUrl };
    const conversionHeaders = {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrfToken,
      'User-Agent': userAgent,
      'Referer': mainUrl,
    };
    if (sessionCookie) {
      conversionHeaders['Cookie'] = sessionCookie;
    }
    
    const conversionResponse = await axios.post(convertUrl, postData, {
      headers: conversionHeaders
    });
    
    if (conversionResponse.data.error || !conversionResponse.data.url) {
      const serverMessage = conversionResponse.data.message || "Spotmate didn't provide a reason for the conversion failure.";
      return res.errorJson(`Failed to convert URL: ${serverMessage}`, 500);
    }
    downloadLink = conversionResponse.data.url;
    
  } catch (error) {
    let errorMessage = "Failed during Spotify URL conversion. Spotmate server might be experiencing issues.";
    if (error.response && error.response.data && typeof error.response.data.message === 'string') {
      errorMessage = `Spotmate returned an error: ${error.response.data.message}`;
    } else if (error.response && error.response.status) {
      errorMessage = `Conversion failed, Spotmate returned status code ${error.response.status}.`;
    }
    return res.errorJson(errorMessage, 500);
  }
  
  if (!downloadLink) {
    return res.errorJson("No download URL was provided after the conversion process.", 500);
  }
  
  try {
    const streamResponse = await axios.get(downloadLink, {
      responseType: 'arraybuffer', // Changed to arraybuffer
      headers: {
        'User-Agent': userAgent,
        'Referer': mainUrl
      }
    });
    
    if (streamResponse.headers['content-type']) {
      res.setHeader('Content-Type', streamResponse.headers['content-type']);
    }
    if (streamResponse.headers['content-disposition']) {
      res.setHeader('Content-Disposition', streamResponse.headers['content-disposition']);
    }
    if (streamResponse.headers['content-length']) {
      res.setHeader('Content-Length', streamResponse.headers['content-length']);
    }
    
    res.send(Buffer.from(streamResponse.data)); // Send the ArrayBuffer as a Buffer
    
  } catch (error) {
    let finalErrorMessage = "Failed to download the file from the source server.";
    if (error.response && error.response.status) {
      finalErrorMessage = `File download failed, source server returned status code ${error.response.status}.`;
    }
    if (!res.headersSent) {
      return res.errorJson(finalErrorMessage, 500);
    } else {
      if (!res.writableEnded) {
        res.end();
      }
    }
  }
};
