const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function(req, res) {
  try {
    const soundcloudUrl = req.query.url;
    
    if (!soundcloudUrl) {
      return res.errorJson("URL Soundcloud mana bro? Kosong nih.", 400);
    }
    
    if (!/^(https?:\/\/)?(www\.)?(m\.)?soundcloud\.com.*|^(https?:\/\/)?on\.soundcloud\.com.*/.test(soundcloudUrl)) {
      return res.errorJson("Format URL SoundCloud-nya kaga bener nih, cek lagi dong!", 400);
    }
    
    const initialPageUrl = 'https://www.forhub.io/soundcloud/';
    const headersStep1 = {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.125 Mobile Safari/537.36',
      'Referer': 'https://www.forhub.io/soundcloud/',
    };
    
    let csrfToken;
    let siteCookies = '';
    
    const initialResponse = await axios.get(initialPageUrl, { headers: headersStep1 });
    const $initial = cheerio.load(initialResponse.data);
    csrfToken = $initial('input[name="csrf_token"]').val();
    
    if (!csrfToken) {
      return res.errorJson("Waduh, token CSRF-nya ngumpet nih, gak ketemu!", 500);
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
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.125 Mobile Safari/537.36',
      'Referer': 'https://www.forhub.io/soundcloud/',
    };
    
    if (siteCookies) {
      headersStep2['Cookie'] = siteCookies;
    }
    
    const downloadPageResponse = await axios.post(downloadPageUrl, postDataPayload, { headers: headersStep2 });
    const $downloadPage = cheerio.load(downloadPageResponse.data);
    
    const downloadDiv = $downloadPage('div#dlMP3');
    const base64EncodedSrc = downloadDiv.attr('data-src');
    const fileNameFromData = downloadDiv.attr('data-name');
    
    if (!base64EncodedSrc) {
      const forhubError = $downloadPage('.alert.alert-danger').text().trim();
      if (forhubError) {
        return res.errorJson(`Forhub bilang: "${forhubError}". Kayaknya URL lo bermasalah atau lagunya private, cuy.`, 400);
      }
      return res.errorJson("Yah, link downloadnya gak nongol. Mungkin URL-nya salah atau lagunya udah dihapus?", 404);
    }
    
    const actualDownloadUrl = Buffer.from(base64EncodedSrc, 'base64').toString('utf-8');
    const fileName = fileNameFromData ? `${fileNameFromData}.mp3` : "downloaded_song.mp3";
    
    const songTitleElement = $downloadPage('tr.mobtable2 td.small-10.columns').eq(1);
    const songQualityElement = $downloadPage('tr.mobtable2 td.small-10.columns').eq(2);
    
    const songTitle = songTitleElement.text().trim() || "Judul Gak Ditemuin";
    const songQuality = songQualityElement.text().trim() || "Kualitas Gak Ditemuin";
    
    res.successJson({
      title: songTitle,
      quality: songQuality,
      fileName: fileName,
      downloadUrl: actualDownloadUrl
    });
    
  } catch (error) {
    let userFriendlyError = "Aduh, ada yang error nih pas nge-scrape. Coba lagi ntar ya, Bosque!";
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      userFriendlyError = "Gak bisa nyambung ke server Forhub nih, jangan-jangan servernya lagi rebahan.";
    } else if (error.response) {
      userFriendlyError = `Servernya ngasih kode ${error.response.status}, artinya ada yang gak beres di sana, bukan di kita.`;
    } else if (error.message && error.message.includes('timeout')) {
      userFriendlyError = "Kelamaan nunggu respon dari servernya nih, coba lagi aja siapa tau udah cepet.";
    }
    res.errorJson(userFriendlyError, 500);
  }
};