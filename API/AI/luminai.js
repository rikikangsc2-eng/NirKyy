const axios = require('axios');

module.exports = async (req, res) => {
  try {
    const response = await axios.post("https://luminai.my.id/", {
      content: req.query.prompt || "Hallo apa kabar",
      user: "user-58595",
      webSearchMode: req.query.web === "true" ? true : false
    }, {
      headers: {
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "Connection": "keep-alive",
        "Content-Type": "application/json",
        "Cookie": "user=user-58595",
        "Host": "luminai.my.id",
        "Origin": "https://luminai.my.id",
        "Referer": "https://luminai.my.id/chat",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
        "X-Content-Type-Options": "nosniff",
        "X-XSS-Protection": "1; mode=block"
      }
    });
    
    res.successJson(response.data);
  } catch (error) {
    res.errorJson({ error: error.message });
  }
};