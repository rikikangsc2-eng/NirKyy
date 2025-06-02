const axios = require('axios');
const { JSDOM } = require('jsdom');

module.exports = async (req, res) => {
  try {
    const spotifyUrl = req.query.url;
    if (!spotifyUrl) {
      return res.errorJson({ error: "Missing Spotify URL" }, 400);
    }
    
    const url = 'https://spowload.com/en';
    const userAgent = 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.40 Mobile Safari/537.36';
    const headers = {
      'User-Agent': userAgent,
      'Referer': url
    };
    
    const response = await axios.get(url, { headers });
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    const csrfToken = document.querySelector('input[name="_token"]')?.value;
    if (!csrfToken) throw new Error('CSRF token not found');
    
    const formAction = document.querySelector('form')?.action || url;
    const inputName = document.querySelector('input[name="trackUrl"]');
    if (!inputName) throw new Error('Input field not found');
    
    const data = new URLSearchParams();
    data.append('_token', csrfToken);
    data.append(inputName.name, spotifyUrl);
    
    const cookies = response.headers['set-cookie'];
    const cookieHeader = cookies ? cookies.join('; ') : '';
    headers['Cookie'] = cookieHeader;
    
    const submitResponse = await axios.post(formAction, data, {
      headers,
      maxRedirects: 0,
      validateStatus: (status) => status === 302
    });
    
    const redirectUrl = submitResponse.headers.location;
    if (!redirectUrl) throw new Error('Redirect URL not found');
    
    const redirectResponse = await axios.get(redirectUrl, { headers });
    const redirectDom = new JSDOM(redirectResponse.data);
    const redirectDocument = redirectDom.window.document;
    
    const newCsrfToken = redirectDocument.querySelector('meta[name="csrf-token"]')?.content;
    if (!newCsrfToken) throw new Error('New CSRF token not found');
    
    const finalHeaders = {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': newCsrfToken,
      'Cookie': cookieHeader,
      'User-Agent': userAgent
    };
    
    const finalData = {
      urls: spotifyUrl,
      cover: ""
    };
    
    const finalResponse = await axios.post('https://spowload.com/convert', finalData, { headers: finalHeaders });
    
    if (finalResponse.data.error) throw new Error('Conversion failed');
    
    const downloadUrl = finalResponse.data.url;
    if (!downloadUrl) throw new Error('Download URL not found');
    
    const decodedLink = decodeURIComponent(downloadUrl);
    const regex = /https:\/\/node01\.dlapi\.app\/api\/dl\?link=(.*?)&name=/;
    const match = decodedLink.match(regex);
    
    if (match && match[1]) {
      let directLink = decodeURIComponent(match[1]);
      const urlObj = new URL(directLink);
      const encodedParams = new URLSearchParams(urlObj.search);
      
      const properlyEncodedUrl = `${urlObj.origin}${urlObj.pathname}?${encodedParams.toString()}`;
      
      res.successJson(properlyEncodedUrl);
    } else {
      res.errorJson('Gagal mendapatkan download Link');
    }
  } catch (error) {
    res.errorJson({ error: error.message });
  }
};