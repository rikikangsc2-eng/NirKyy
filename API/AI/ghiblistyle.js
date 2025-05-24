const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  return res.errorJson("Sengaja gw stop, Error lagi nyari alternatif lain bos")
  const ghibli = {
    api: {
      base: 'https://ghibli-image-generator.com',
      imageBase: 'https://imgs.ghibli-image-generator.com',
      endpoints: {
        fileExists: '/api/trpc/uploads.chatFileExists?batch=1',
        signed: '/api/trpc/uploads.signedUploadUrl?batch=1',
        create: '/api/trpc/ai.create4oImage?batch=1',
        task: '/api/trpc/ai.getTaskInfo?batch=1'
      }
    },
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'origin': 'https://ghibli-image-generator.com',
      'referer': 'https://ghibli-image-generator.com/',
      'user-agent': 'Postify/1.0.0'
    },
    formats: ['jpg', 'jpeg', 'png', 'webp'],
    isImageUrl: (url) => {
      try {
        const parsed = new URL(url);
        const ext = parsed.pathname.split('.').pop().toLowerCase();
        return ghibli.formats.includes(ext);
      } catch {
        return false;
      }
    },
    downloadImage: async (url) => {
      try {
        const res = await axios.get(url, {
          responseType: 'arraybuffer',
          headers: ghibli.headers
        });
        const ext = url.split('.').pop().toLowerCase();
        return {
          buffer: Buffer.from(res.data),
          ext,
          type: `image/${ext}`
        };
      } catch {
        return null;
      }
    },
    uploadToS3: async (filename, type, buffer) => {
      const fullPath = `original/${filename}`;
      const signedRes = await axios.post(
        ghibli.api.base + ghibli.api.endpoints.signed,
        { "0": { "json": { path: fullPath, bucket: "ghibli-image-generator" } } },
        { headers: ghibli.headers }
      );
      const uploadUrl = signedRes.data?.[0]?.result?.data?.json;
      if (!uploadUrl) throw new Error('Gagal mendapatkan signed URL');

      await axios.put(uploadUrl, buffer, { headers: { 'Content-Type': type } });
      return `${ghibli.api.imageBase}/${fullPath}`;
    },
    createTask: async (imageUrl) => {
      const createRes = await axios.post(
        ghibli.api.base + ghibli.api.endpoints.create,
        { "0": { "json": { imageUrl, prompt: "restyle image in studio ghibli style, keep all details", size: "1:1" } } },
        { headers: ghibli.headers }
      );
      return createRes.data?.[0]?.result?.data?.json?.data?.taskId;
    },
    waitForResult: async (taskId) => {
      for (let i = 0; i < 30; i++) {
        const res = await axios.get(ghibli.api.base + ghibli.api.endpoints.task, {
          params: { input: JSON.stringify({ "0": { json: { taskId } } }) },
          headers: ghibli.headers
        });
        const data = res.data?.[0]?.result?.data?.json?.data;
        if (data?.status === 'SUCCESS' && data.successFlag === 1) {
          return data.response.resultUrls?.[0];
        }
        if (['FAILED', 'GENERATE_FAILED'].includes(data?.status)) break;
        await new Promise(r => setTimeout(r, 5000));
      }
      return null;
    }
  };

  const url = req.query.url;
  if (!url) return res.errorJson('Parameter url wajib diisi', 400);
  if (!ghibli.isImageUrl(url)) return res.errorJson('URL tidak valid atau format gambar tidak didukung');

  try {
    const img = await ghibli.downloadImage(url);
    if (!img) return res.errorJson('Gagal mengunduh gambar');

    const filename = `img_${Date.now()}_${Math.random().toString(36).slice(2)}.${img.ext}`;
    const uploadedUrl = await ghibli.uploadToS3(filename, img.type, img.buffer);

    const taskId = await ghibli.createTask(uploadedUrl);
    if (!taskId) return res.errorJson('Gagal membuat task');

    const resultUrl = await ghibli.waitForResult(taskId);
    if (!resultUrl) return res.errorJson('Gagal menghasilkan gambar');

    res.succesJson({ url: resultUrl, taskId });
  } catch (err) {
    res.errorJson('Terjadi kesalahan server: ' + err.message, 500);
  }
};