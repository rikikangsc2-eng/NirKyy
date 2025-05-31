const axios = require('axios');
const querystring = require('querystring');

module.exports = async function(req, res) {
  try {
    const paramsDariLu = req.query;
    
    if (Object.keys(paramsDariLu).length === 0) {
      return res.errorJson("Waduh, parameternya kosong nih. Coba isi dulu ya.", 400);
    }
    
    const urlTarget = `https://nirkyy-api.hf.space/api/fis?${querystring.stringify(paramsDariLu)}`;
    
    const responDariApi = await axios.get(urlTarget, {
      responseType: 'stream'
    });
    
    if (responDariApi.headers['content-type'] && responDariApi.headers['content-type'].includes('image/jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
      responDariApi.data.pipe(res);
    } else {
      let pesanErrorTambahan = "Kayaknya API tujuan gak ngasih gambar JPEG deh.";
      if (responDariApi.headers['content-type']) {
        pesanErrorTambahan += ` Malah ngasih: ${responDariApi.headers['content-type']}`;
      }
      return res.errorJson(`Ada yang aneh nih sama respons dari API. ${pesanErrorTambahan}`, 502);
    }
    
  } catch (e) {
    if (e.response) {
      let pesanErrorDetail = `Server API tujuan ngambek nih, statusnya ${e.response.status}.`;
      if (e.response.data && typeof e.response.data === 'object') {
        pesanErrorDetail += ` Pesannya: ${JSON.stringify(e.response.data)}`;
      } else if (e.response.data) {
        pesanErrorDetail += ` Pesannya: ${e.response.data}`;
      }
      return res.errorJson(pesanErrorDetail, e.response.status || 500);
    } else if (e.request) {
      return res.errorJson("Duh, gagal nyambung ke API tujuan nih. Cek koneksi atau URL-nya coba.", 503);
    } else {
      return res.errorJson(`Waduh, ada yang error nih pas mau ngambil data: ${e.message}. Coba lagi nanti ya.`, 500);
    }
  }
};