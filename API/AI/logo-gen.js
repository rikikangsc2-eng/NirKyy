const axios = require('axios');

module.exports = async function(req, res) {
  try {
    const initialPrompt = req.query.prompt;

    if (!initialPrompt) {
      return res.errorJson({ message: 'Prompt-nya kosong nih, mau bikin gambar apa dong?' }, 400);
    }

    const fluxaiUrl = 'https://fluxai.pro/api/prompts/generate';
    const nirkyyUrlBase = 'https://nirkyy.koyeb.app/api/v1/writecream-text2image';

    const fluxaiResponse = await axios.post(fluxaiUrl, {
      prompt: initialPrompt,
      style: 'logo-design'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.7103.60 Mobile Safari/537.36',
        'Referer': 'https://fluxai.pro/image-prompt-generator'
      },
      responseType: 'text'
    });

    if (fluxaiResponse.status !== 200 || !fluxaiResponse.data) {
      return res.status(fluxaiResponse.status || 500).json({ message: 'Aduh, gagal ngambil ide prompt dari FluxAI nih. Servernya gak respon atau datanya kosong.' });
    }

    const rawTextData = fluxaiResponse.data;
    const lines = rawTextData.split('\n').filter(line => line.trim() !== '');
    let promptParts = [];

    for (const line of lines) {
      if (line.startsWith('0:')) {
        let contentJsonString = line.substring(2).trim();
        if (contentJsonString.startsWith('"') && contentJsonString.endsWith('"')) {
          try {
            promptParts.push(JSON.parse(contentJsonString));
          } catch (jsonParseError) {
            
          }
        }
      }
    }

    const generatedPrompt = promptParts.join("").trim();

    if (!generatedPrompt) {
      return res.errorJson({ message: 'Sumpah, format balasan dari FluxAI aneh banget atau gak ngasih prompt. Gak bisa lanjut, coy!' }, 422);
    }

    const encodedPrompt = encodeURIComponent(generatedPrompt);
    const nirkyyImageUrl = `${nirkyyUrlBase}?prompt=${encodedPrompt}&aspect_ratio=1%3A1`;

    const nirkyyResponse = await axios.get(nirkyyImageUrl, {
      responseType: 'arraybuffer' 
    });

    if (nirkyyResponse.status !== 200) {
      return res.errorJson({ message: 'Yah, gagal bikin gambarnya di Nirkyy. Servernya lagi ngambek kayaknya?' }, nirkyyResponse.status || 500);
    }

    if (res.headersSent) {
      return;
    }

    res.setHeader('Content-Type', nirkyyResponse.headers['content-type'] || 'image/png');
    res.end(nirkyyResponse.data); 

  } catch (e) {
    if (!res.headersSent) {
      res.errorJson({ message: 'Busett, ada error teknis nih bro. Coba lagi ntar ya!' }, 500);
    } else if (!res.writableEnded) {
      res.end();
    }
  }
};
