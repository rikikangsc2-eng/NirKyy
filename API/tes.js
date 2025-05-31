const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function(req, res) {
  const agenPengguna = 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.125 Mobile Safari/537.36';
  const alamatUtama = 'https://spotmate.online/en';
  const alamatKonversi = 'https://spotmate.online/convert';
  
  const { url: urlLagu } = req.query;
  
  if (!urlLagu) {
    return res.errorJson("Bro, URL Spotify-nya jangan lupa diisi di query 'url' ya.", 400);
  }
  
  let kukiSesiGabung = '';
  let tokenCsrfSpotmate = '';
  
  try {
    const responAwal = await axios.get(alamatUtama, {
      headers: {
        'User-Agent': agenPengguna,
      }
    });
    
    const $ = cheerio.load(responAwal.data);
    tokenCsrfSpotmate = $('meta[name="csrf-token"]').attr('content');
    
    if (!tokenCsrfSpotmate) {
      return res.errorJson("Duh, token CSRF-nya nggak ketemu nih di halaman Spotmate. Cek lagi coba.", 500);
    }
    
    const semuaKuki = responAwal.headers['set-cookie'];
    if (semuaKuki && Array.isArray(semuaKuki)) {
      kukiSesiGabung = semuaKuki.map(kuki => kuki.split(';')[0]).join('; ');
    }
    
  } catch (eror) {
    return res.errorJson("Waduh, gagal ngambil token CSRF atau kuki dari Spotmate nih. Mungkin servernya lagi sibuk atau ada update.", 500);
  }
  
  let tautanHasil;
  
  try {
    const dataKirim = { urls: urlLagu };
    const kepalaUntukKonversi = {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': tokenCsrfSpotmate,
      'User-Agent': agenPengguna,
      'Referer': alamatUtama,
    };
    if (kukiSesiGabung) {
      kepalaUntukKonversi['Cookie'] = kukiSesiGabung;
    }
    
    const responDariKonversi = await axios.post(alamatKonversi, dataKirim, {
      headers: kepalaUntukKonversi
    });
    
    if (responDariKonversi.data.error || !responDariKonversi.data.url) {
      const pesanDariServer = responDariKonversi.data.message || "Spotmate nggak ngasih tau kenapa, tapi konversinya gagal.";
      return res.errorJson(`Gagal konversi URL nih: ${pesanDariServer}`, 500);
    }
    tautanHasil = responDariKonversi.data.url;
    
  } catch (eror) {
    let pesanSalah = "Gagal pas mau konversi URL Spotify-nya. Server Spotmate lagi rewel kayaknya.";
    if (eror.response && eror.response.data && typeof eror.response.data.message === 'string') {
      pesanSalah = `Spotmate ngasih pesan error: ${eror.response.data.message}`;
    } else if (eror.response && eror.response.status) {
      pesanSalah = `Gagal konversi, Spotmate ngasih status kode ${eror.response.status}.`;
    }
    return res.errorJson(pesanSalah, 500);
  }
  
  if (!tautanHasil) {
    return res.errorJson("Aneh banget, URL buat download-nya kok nggak ada setelah proses konversi.", 500);
  }
  
  try {
    const responUntukStream = await axios.get(tautanHasil, {
      responseType: 'stream',
      headers: {
        'User-Agent': agenPengguna,
        'Referer': alamatUtama
      }
    });
    
    if (responUntukStream.headers['content-type']) {
      res.setHeader('Content-Type', responUntukStream.headers['content-type']);
    }
    if (responUntukStream.headers['content-disposition']) {
      res.setHeader('Content-Disposition', responUntukStream.headers['content-disposition']);
    }
    if (responUntukStream.headers['content-length']) {
      res.setHeader('Content-Length', responUntukStream.headers['content-length']);
    }
    
    responUntukStream.data.pipe(res);
    
    responUntukStream.data.on('error', (erorAliran) => {
      if (!res.headersSent) {
        res.errorJson("Duh, ada masalah pas lagi streaming filenya ke kamu. Coba lagi bentar ya.", 500);
      } else {
        if (!res.writableEnded) {
          res.end();
        }
      }
    });
    
    responUntukStream.data.on('end', () => {
      if (!res.writableEnded) {
        res.end();
      }
    });
    
  } catch (eror) {
    let pesanSalahAkhir = "Waduh, gagal nih mau download filenya dari server sumber.";
    if (eror.response && eror.response.status) {
      pesanSalahAkhir = `Gagal download filenya, server sumber ngasih status kode ${eror.response.status}.`;
    }
    if (!res.headersSent) {
      return res.errorJson(pesanSalahAkhir, 500);
    } else {
      if (!res.writableEnded) {
        res.end();
      }
    }
  }
};