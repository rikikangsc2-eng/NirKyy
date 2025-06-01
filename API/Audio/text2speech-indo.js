const axios = require('axios');

const voices = {
  Anisa: { service: 'StreamElements', voice: 'id-ID-Wavenet-A' },
  Budi: { service: 'StreamElements', voice: 'id-ID-Wavenet-B' },
  Bayu: { service: 'StreamElements', voice: 'id-ID-Wavenet-C' },
  Andika: { service: 'StreamElements', voice: 'Andika' },
  Darma: { service: 'TikTok', voice: 'id_male_darma' },
  Icha: { service: 'TikTok', voice: 'id_female_icha' },
  Noor: { service: 'TikTok', voice: 'id_female_noor' },
  Putra: { service: 'TikTok', voice: 'id_male_putra' },
  Damayanti: { service: 'Cerence', voice: 'Damayanti' },
  Bintang: { service: 'Oddcast', voice: '2-7-28' },
  Putri: { service: 'Oddcast', voice: '1-7-28' },
  Gadis: { service: 'Bing Translator', voice: 'id-ID-GadisNeural' },
  Ardi: { service: 'Bing Translator', voice: 'id-ID-ArdiNeural' }
};

module.exports = async (req, res) => {
  try {
    const { voice, text } = req.query;
    const voiceData = voices[voice];

    if (!voiceData) {
      return res.status(400).json({ message: "Voice tidak valid", voices });
    }

    const payload = new URLSearchParams({
      service: voiceData.service,
      voice: voiceData.voice,
      text
    });

    const response = await axios.post('https://lazypy.ro/tts/request_tts.php', payload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.6998.135 Mobile Safari/537.36',
        'Referer': `https://lazypy.ro/tts/?voice=${voiceData.voice}&service=${voiceData.service}&text=${text}&lang=Indonesian&g=A`
      }
    });

    const audioUrl = response.data.audio_url;
    if (!audioUrl) {
      return res.status(500).json('Audio URL tidak ditemukan');
    }

    const audioResponse = await axios.get(audioUrl, { responseType: 'arraybuffer' });
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(audioResponse.data);
  } catch (error) {
    res.status(500).json(error.message);
  }
};
