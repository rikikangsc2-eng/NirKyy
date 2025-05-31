const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function(req, res) {
  const soundcloudUrl = req.query.url;
  
  if (!soundcloudUrl) {
    return res.errorJson("URL Soundcloud mana bro? Kosong nih.", 400);
  }
  if (!/^(https?:\/\/)?(www\.)?(m\.)?soundcloud\.com.*|^(https?:\/\/)?on\.soundcloud\.com.*/.test(soundcloudUrl)) {
    return res.errorJson("Format URL SoundCloud-nya kaga bener nih, cek lagi dong!", 400);
  }
  
  const baseHeaders = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.125 Mobile Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Fetch-Mode': 'navigate',
    'Upgrade-Insecure-Requests': '1',
  };
  
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const initialPageUrl = 'https://www.forhub.io/soundcloud/';
      const headersStep1 = {
        ...baseHeaders,
        'Referer': 'https://www.forhub.io/soundcloud/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
      };
      
      let csrfToken;
      let siteCookies = '';
      
      const initialResponse = await axios.get(initialPageUrl, { headers: headersStep1, timeout: 15000 });
      const $initial = cheerio.load(initialResponse.data);
      csrfToken = $initial('input[name="csrf_token"]').val();
      
      if (!csrfToken) {
        throw new Error(`CSRF token not found on attempt ${attempt}`);
      }
      
      if (initialResponse.headers['set-cookie']) {
        siteCookies = initialResponse.headers['set-cookie'].map(cookie => cookie.split(';')[0]).join('; ');
      }
      
      const downloadPageUrl = 'https://www.forhub.io/download.php';
      const postDataPayload = new URLSearchParams({
        csrf_token: csrfToken,
        formurl: soundcloudUrl
      }).toString();
      
      const headersStep2 = {
        ...baseHeaders,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer': 'https://www.forhub.io/soundcloud/',
        'Origin': 'https://www.forhub.io',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-User': '?1',
      };
      if (siteCookies) {
        headersStep2['Cookie'] = siteCookies;
      }
      
      const downloadPageResponse = await axios.post(downloadPageUrl, postDataPayload, { headers: headersStep2, timeout: 20000 });
      const $downloadPage = cheerio.load(downloadPageResponse.data);
      const downloadDiv = $downloadPage('div#dlMP3');
      const base64EncodedSrc = downloadDiv.attr('data-src');
      
      if (base64EncodedSrc) {
        const actualDownloadUrl = Buffer.from(base64EncodedSrc, 'base64').toString('utf-8');
        const fileNameFromData = downloadDiv.attr('data-name');
        const sanitizedFileName = fileNameFromData ? fileNameFromData.replace(/[^a-zA-Z0-9\s._-]/g, '_').replace(/\s+/g, '_') : "downloaded_song";
        const fileName = `${sanitizedFileName}.mp3`;
        
        const songTitleElement = $downloadPage('tr.mobtable2 td.small-10.columns').eq(1);
        const songQualityElement = $downloadPage('tr.mobtable2 td.small-10.columns').eq(2);
        
        const songTitle = songTitleElement.text().trim() || "Judul Gak Ditemuin";
        const songQuality = songQualityElement.text().trim() || "Kualitas Gak Ditemuin";
        
        return res.successJson({
          title: songTitle,
          quality: songQuality,
          fileName: fileName,
          downloadUrl: actualDownloadUrl,
          source: "forhub.io"
        });
      } else {
        const forhubError = $downloadPage('.alert.alert-danger').text().trim();
        if (forhubError) {
          return res.errorJson(`Forhub bilang: "${forhubError}". Kayaknya URL lo bermasalah atau lagunya private, cuy. Gak dicoba lagi.`, 400);
        }
        if (attempt < 10) {
          await new Promise(resolve => setTimeout(resolve, 1000 + Math.floor(Math.random() * 1000)));
          continue;
        }
      }
    } catch (error) {
      if (attempt === 10) {
        let userFriendlyError = "Aduh, udah 10 kali nyoba tapi tetep gagal nge-scrape dari Forhub.";
        if (error.message && error.message.startsWith("CSRF token not found")) {
          userFriendlyError = "Waduh, token CSRF-nya ngumpet terus nih, gak ketemu setelah 10 kali coba!";
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          userFriendlyError = "Gak bisa nyambung ke server Forhub nih, jangan-jangan servernya lagi rebahan. Udah coba 10x.";
        } else if (error.response && error.response.status) {
          userFriendlyError = `Servernya Forhub ngasih kode ${error.response.status} terus, artinya ada yang gak beres di sana. Udah coba 10x.`;
        } else if (error.message && (error.message.toLowerCase().includes('timeout') || error.code === 'ECONNABORTED')) {
          userFriendlyError = "Kelamaan nunggu respon dari servernya Forhub nih, udah 10x coba padahal.";
        } else if (error.message) {
          userFriendlyError = `Errornya aneh nih pas mau ke Forhub (percobaan ke-${attempt}): ${error.message}. Udah 10x nyoba padahal.`;
        }
        return res.errorJson(userFriendlyError, 500);
      }
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.floor(Math.random() * 1000)));
    }
  }
  
  return res.errorJson("Yah, link downloadnya gak nongol setelah 10 kali nyoba dari Forhub. Mungkin URL-nya salah, lagunya private, atau Forhub lagi ngambek.", 404);
};