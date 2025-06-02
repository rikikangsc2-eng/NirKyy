const axios = require('axios');
const FormData = require('form-data');

const snapsave = async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.errorJson({ status: false, code: 400, result: { error: "Linknya mana? Niat download kagak sih? 🗿" } }, 400)
  }
  
  const platform = isPlatform(url);
  if (!platform) {
    return res.errorJson({ status: false, code: 400, result: { error: "Linknya kagak valid tuh.. cobalah input yang bener 🗿" } }, 400);
  }
  
  try {
    const formData = new FormData();
    formData.append('url', url);
    
    const response = await axios.post(`${API.base}${API.download}`, formData, { headers });
    const b = response.data.match(/eval\(function\(h,u,n,t,e,r\){.*?"(.*?)",(\d+),"(.*?)",(\d+),(\d+),(\d+)\)\)/);
    
    if (!b) {
      return res.errorJson({ status: false, code: 404, result: { error: "Data encodenya kagak ada bree 🙃" } }, 404);
    }
    
    const [_, encodedStr, u, n, t, e] = b;
    const decoded = decode(encodedStr, parseInt(u), n, parseInt(t), parseInt(e));
    
    if (!decoded.status) {
      return res.errorJson(decoded);
    }
    
    const medias = extract(decoded.result.media, platform);
    if (!medias.status) {
      return res.errorJson(medias);
    }
    
    return res.successJson({ platform, media: medias.result.media });
    
  } catch (error) {
    return res.errorJson({ status: false, code: error.response?.status || 500, result: { error: error.message } });
  }
};

const API = {
  base: "https://snapsave.app",
  download: "/action.php?lang=id"
};

const headers = {
  'authority': 'snapsave.app',
  'origin': 'https://snapsave.app',
  'referer': 'https://snapsave.app/id',
  'user-agent': 'Postify/1.0.0'
};

const regex = {
  instagram: /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|tv|stories)\/([^/?#&]+)/i,
  facebook: /^https?:\/\/(www\.|web\.|m\.)?(facebook\.com|fb\.watch|fb\.com)\/.+/i,
  tiktok: /^https?:\/\/((?:vm|vt|www|m)\.)?tiktok\.com\/.+/i
};

function isPlatform(url) {
  if (!url) return null;
  for (const [platform, pattern] of Object.entries(regex)) {
    if (pattern.test(url)) return platform;
  }
  return null;
}

function decode(h, u, n, t, e) {
  let result = '';
  const charset = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/";
  
  for (let i = 0; i < h.length; i++) {
    let segment = '';
    while (i < h.length && h[i] !== n[e]) segment += h[i++];
    
    for (let j = 0; j < n.length; j++) {
      segment = segment.replace(new RegExp(n[j], 'g'), j.toString());
    }
    
    try {
      let decimal = segment.split('').reverse().reduce((acc, char, idx) => {
        const charIndex = charset.slice(0, e).indexOf(char);
        return charIndex !== -1 ? acc + charIndex * Math.pow(e, idx) : acc;
      }, 0);
      
      const charCode = decimal - t;
      if (charCode >= 0) result += String.fromCharCode(charCode);
    } catch (err) {
      return { status: false, code: 500, result: { error: "Decodenya gagal bree 🤫", message: err.message } };
    }
  }
  
  try {
    return { status: true, code: 200, result: { media: decodeURIComponent(escape(result)) } };
  } catch (err) {
    return { status: true, code: 200, result: { media: result } };
  }
}

function extract(media, platform) {
  try {
    const mediax = {
      image: [],
      video: [],
      thumbnail: null
    };
    
    const section = media.match(/download-section"\).innerHTML = "(.*?)";/);
    if (!section) {
      return { status: false, code: 404, result: { error: "Section Downloadnya kagak ada bree 😬", media: null } };
    }
    
    const mediax_raw = section[1].replace(/\\"/g, '"').replace(/\\\//g, '/');
    
    const thumb = mediax_raw.match(/<img src="([^"]+)"/);
    if (thumb) {
      mediax.thumbnail = thumb[1];
    }
    
    const title = mediax_raw.match(/<strong>(.*?)<\/strong>/);
    const filename = title ? title[1] : 'media';
    
    if (platform === 'facebook' || platform === 'instagram') {
      const urlRegex = /https:\/\/d\.rapidcdn\.app\/d\?token=[^"]+/g;
      const b = mediax_raw.matchAll(urlRegex);
      
      for (const match of b) {
        const url = match[0];
        const toket = JSON.parse(Buffer.from(url.split('token=')[1].split('.')[1], 'base64').toString());
        
        const items = {
          url: url + '&dl=1',
          filename: filename + (toket.filename.match(/\.[^.]+$/)?.[0] || ''),
          quality: toket.quality || 'SD'
        };
        
        if (toket.filename.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
          mediax.image.push(items);
        } else if (toket.filename.toLowerCase().endsWith('.mp4')) {
          mediax.video.push(items);
        }
      }
    } else if (platform === 'tiktok') {
      const urlRegex = /https:\/\/snapxcdn\.com\/v2\/\?token=[^&]+/g;
      const b = media.match(urlRegex);
      
      if (b) {
        b.forEach(match => {
          mediax.video.push({
            url: match,
            filename: `${filename}.mp4`,
            quality: 'HD'
          });
        });
      }
    }
    
    return { status: true, code: 200, result: { error: "Success", media: mediax } };
  } catch (error) {
    return { status: false, code: 500, result: { error: "Link Medianya kagak bisa diekstrak bree 🤷🏻", message: error.message } };
  }
}

module.exports = snapsave;