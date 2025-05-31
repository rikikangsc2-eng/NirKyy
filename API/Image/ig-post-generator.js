const axios = require('axios');

module.exports = async function(req, res) {
  try {
    const kueriPengguna = req.query;
    const stringKueri = new URLSearchParams(kueriPengguna).toString();
    const urlTujuan = `https://nirkyy-api.hf.space/api/fis?${stringKueri}`;
    
    const responDariLuar = await axios({
      method: 'get',
      url: urlTujuan,
      responseType: 'stream'
    });
    
    res.setHeader('Content-Type', responDariLuar.headers['content-type'] || 'image/jpeg');
    responDariLuar.data.pipe(res);
    
  } catch (eror) {
    if (eror.response) {
      res.errorJson(
        `Waduh, kayaknya API yang kamu tuju lagi ngambek nih, ngasih status ${eror.response.status}. Pesan dari sononya sih: '${eror.response.statusText || 'Gak ada pesan khusus.'}' Coba cek lagi inputanmu atau mungkin API-nya lagi ada gangguan.`,
        eror.response.status
      );
    } else if (eror.request) {
      res.errorJson(
        'Bro, gagal total nih nyambung ke API tujuan. Cek koneksi internetmu deh, atau mungkin alamat API-nya lagi gak bisa diakses sama sekali. Sabar ya, coba lagi nanti.',
        503
      );
    } else {
      res.errorJson(
        `Yah, ada yang aneh nih pas mau ngolah permintaanmu di server kami. Maaf banget ya. Detail errornya: ${eror.message}. Coba lagi aja beberapa saat lagi.`,
        500
      );
    }
  }
};