const axios = require('axios');

function randomString(length) {
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateToken() {
  const payload = {
    bR6wF: {
      nV5kP: "Mozilla/5.0 (Linux; Android 10)",
      lQ9jX: Intl.DateTimeFormat().resolvedOptions().locale || 'id-ID',
      sD2zR: "431x958",
      tY4hL: Intl.DateTimeFormat().resolvedOptions().timeZone,
      pL8mC: "Linux armv81",
      cQ3vD: new Date().getFullYear(),
      hK7jN: new Date().getHours()
    },
    uT4bX: { mM9wZ: [], kP8jY: [] },
    tuTcS: Math.floor(Date.now() / 1000),
    tDfxy: null,
    RtyJt: randomString(36)
  };
  return "d8TW0v" + Buffer.from(JSON.stringify(payload)).toString('base64');
}

module.exports = async (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) return res.errorJson({ error: "Missing prompt" }, 400);
  try {
    const session_id = randomString(36);
    const tokenParam = generateToken();
    const tokenParams = new URLSearchParams();
    tokenParams.append('session_id', session_id);
    tokenParams.append('token', tokenParam);
    const tokenRes = await axios.post('https://data.toolbaz.com/token.php', tokenParams.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'origin': 'https://toolbaz.com',
        'referer': 'https://toolbaz.com/'
      }
    });
    if (!tokenRes.data.success) return res.status(500).json({ error: "Token generation failed" });
    const capcha = tokenRes.data.token;
    const writingParams = new URLSearchParams();
    writingParams.append('text', prompt);
    writingParams.append('capcha', capcha);
    writingParams.append('model', 'gpt-4o-latest');
    writingParams.append('session_id', session_id);
    const writingRes = await axios.post('https://data.toolbaz.com/writing.php', writingParams.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'origin': 'https://toolbaz.com',
        'referer': 'https://toolbaz.com/'
      }
    });
    res.successJson(writingRes.data);
  } catch {
    res.errorJson({ error: "Request failed" });
  }
};