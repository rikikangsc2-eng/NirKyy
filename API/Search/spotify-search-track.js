const axios = require('axios');

module.exports = async function(rq, rs) {
  const qy = rq.query.query;
  
  if (!qy) {
    return rs.errorJson('Mohon maaf, parameter query tidak ditemukan. Tolong berikan query pencarian.', 400);
  }
  
  try {
    const ul = `https://spotifydown.app/api/metadata?link=${encodeURIComponent(qy.trim())}`;
    const cf = {
      method: 'POST',
      url: ul,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.125 Mobile Safari/537.36',
        'Content-Type': 'application/json',
        'Referer': 'https://spotifydown.app/'
      }
    };
    
    const rp = await axios.request(cf);
    
    if (rp.data && rp.data.data && rp.data.data.tracks) {
      const tr = rp.data.data.tracks;
      return rs.successJson(tr);
    } else {
      return rs.errorJson('Sepertinya ada yang aneh dengan respons dari server. Data track tidak dapat ditemukan.', 500);
    }
    
  } catch (er) {
    let em;
    if (er.response) {
      em = `Waduh, server tujuan merespons dengan status ${er.response.status}. Pesan: ${er.response.data ? JSON.stringify(er.response.data) : 'Tidak ada detail tambahan.'}`;
    } else if (er.request) {
      em = 'Duh, permintaan sudah dikirim tapi tidak ada respons dari server. Mungkin ada masalah jaringan atau server sedang sibuk.';
    } else {
      em = `Ups, terjadi kesalahan saat menyiapkan permintaan: ${er.message}. Coba periksa lagi ya.`;
    }
    return rs.errorJson(`Proses pengambilan data gagal. ${em}`, 500);
  }
};