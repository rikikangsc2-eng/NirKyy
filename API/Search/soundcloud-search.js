/*
 * 🌟 Source: https://whatsapp.com/channel/0029Vb5EZCjIiRotHCI1213L/243
 * * ✨ Jangan lupa follow @NbScrep yaa!
 * Biar dia bagi-bagi terus: ✓
 * * InI Rian Punya ❤️
 */

const axios = require('axios');

const ca = { vr: '', id: '' };

module.exports = async function(rq, rs) {
  const gI = async () => {
    try {
      const { data: ht } = await axios.get('https://soundcloud.com/', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Exonity/1.0' }
      });
      const vr = ht.match(/<script>window\.__sc_version="(\d{10})"<\/script>/)?.[1];
      if (!vr) return null;
      if (ca.vr === vr && ca.id) return ca.id;
      
      const sm = [...ht.matchAll(/<script.*?src="(https:\/\/a-v2\.sndcdn\.com\/assets\/[^"]+)"/g)];
      for (const [, su] of sm) {
        try {
          const { data: jd } = await axios.get(su, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Exonity/1.0' }
          });
          const im = jd.match(/client_id:"([a-zA-Z0-9]{32})"/);
          if (im && im[1]) {
            ca.vr = vr;
            ca.id = im[1];
            return im[1];
          }
        } catch (er) {
          // Abaikan error pengambilan skrip individual, coba skrip berikutnya
        }
      }
      return null;
    } catch (er) {
      // Gagal mengambil halaman utama Soundcloud atau tidak ada versi
      return null;
    }
  };
  
  const fD = (ms) => {
    if (isNaN(ms) || ms === null) return '0:00';
    const sc = Math.floor(ms / 1000);
    const mn = Math.floor(sc / 60);
    const s_ = sc % 60;
    return `${mn}:${s_.toString().padStart(2, '0')}`;
  };
  
  const fN = (nb) => {
    if (isNaN(nb) || nb === null) return '0';
    if (nb >= 1e6) return (nb / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (nb >= 1e3) return (nb / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return nb.toString();
  };
  
  const fA = (ds) => {
    if (!ds) return null;
    try {
      const d_ = new Date(ds);
      return d_.toISOString().split('T')[0];
    } catch (er) {
      return null;
    }
  };
  
  try {
    const { query: qy } = rq.query;
    if (!qy) {
      return rs.errorJson('Mohon maaf, query pencarian tidak boleh kosong.', 400);
    }
    
    const ci = await gI();
    if (!ci) {
      return rs.errorJson('Duh, gagal mendapatkan client_id dari SoundCloud. Mungkin ada perubahan di pihak mereka.', 500);
    }
    
    const lm = 30;
    const ul = 'https://api-v2.soundcloud.com/search/tracks';
    
    const { data: ap } = await axios.get(ul, {
      params: { q: qy, client_id: ci, limit: lm, app_version: ca.vr || undefined },
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Exonity/1.0', 'Accept': 'application/json' }
    });
    
    if (!ap || !ap.collection) {
      return rs.errorJson('Sepertinya ada masalah saat mengambil data dari SoundCloud. Respon tidak sesuai harapan.', 500);
    }
    
    const rd = ap.collection.map(td => ({
      id: td.id,
      title: td.title,
      url: td.permalink_url,
      duration: fD(td.full_duration),
      thumbnail: td.artwork_url || td.user?.avatar_url,
      author: {
        name: td.user?.username,
        url: td.user?.permalink_url
      },
      like_count: fN(td.likes_count || 0),
      play_count: fN(td.playback_count || 0),
      release_date: fA(td.release_date || td.created_at)
    }));
    
    return rs.successJson(rd);
    
  } catch (er) {
    let msg = 'Waduh, terjadi kesalahan internal saat mencoba mengambil data dari SoundCloud.';
    if (er.response) {
      msg = `Oops, SoundCloud merespon dengan status ${er.response.status}. Mungkin ada yang salah dengan permintaan atau layanan mereka.`;
    } else if (er.request) {
      msg = 'Sepertinya tidak ada respon dari SoundCloud. Cek koneksi internet atau coba lagi nanti ya.';
    }
    return rs.errorJson(msg, 500);
  }
};