const axios = require("axios");
const { FormData, Blob } = require("formdata-node");

class ImgUpscaler {
  constructor() {
    this.apiUrl = "https://get1.imglarger.com/api/UpscalerNew/UploadNew";
    this.statusUrl = "https://get1.imglarger.com/api/UpscalerNew/CheckStatusNew";
    this.headers = {
      accept: "application/json, text/plain, */*",
      "accept-language": "id-ID,id;q=0.9",
      "cache-control": "no-cache",
      connection: "keep-alive",
      origin: "https://imgupscaler.com",
      pragma: "no-cache",
      referer: "https://imgupscaler.com/",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "user-agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      "sec-ch-ua":
        '"Chromium";v="131", "Not_A Brand";v="24", "Microsoft Edge Simulate";v="131", "Lemur";v="131"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
    };
  }

  async upscale({ imgUrl, scale = 2 }) {
    try {
      const { data: fileBuffer, headers } = await axios.get(imgUrl, {
        responseType: "arraybuffer",
      });
      const ext = headers["content-type"].split("/")[1];
      const formData = new FormData();
      formData.append(
        "myfile",
        new Blob([fileBuffer], { type: `image/${ext}` }),
        `file.${ext}`
      );
      formData.append("scaleRadio", scale.toString());
      const { data } = await axios.post(this.apiUrl, formData, {
        headers: { ...this.headers, ...formData.headers },
      });
      return data.code === 200 && data.data?.code
        ? await this.pollStatus({ jobCode: data.data.code, scale })
        : Promise.reject("Upload failed or invalid response.");
    } catch (error) {
      console.error("Upload failed:", error.response?.data || error.message);
      return null;
    }
  }

  async pollStatus({ jobCode, scale }) {
    try {
      while (true) {
        const { data } = await axios.post(
          this.statusUrl,
          { code: jobCode, scaleRadio: scale },
          { headers: { ...this.headers, "content-type": "application/json" } }
        );
        if (data.code === 200 && data.data?.status === "success") return data.data;
        await new Promise((res) => setTimeout(res, 5000));
      }
    } catch (error) {
      console.error("Polling failed:", error.response?.data || error.message);
      return null;
    }
  }
}

module.exports = async (req, res) => {
  const { url } = req.query;
  if (!url) return res.errorJson("Missing url", 400);

  const upscaler = new ImgUpscaler();
  try {
    const result = await upscaler.upscale({ imgUrl: url });
    if (result && result.downloadUrls && result.downloadUrls.length > 0) {
      const imageUrl = result.downloadUrls[0];
      try {
        const imageResponse = await axios.get(imageUrl, {
          responseType: 'arraybuffer' 
        });

        res.setHeader('Content-Type', imageResponse.headers['content-type']);
        res.send(Buffer.from(imageResponse.data)); 
      } catch (error) {
        console.error("Error fetching or streaming image:", error);
        res.errorJson("Error processing image");
      }
    } else {
      res.errorJson("Upscaling failed or no download URL found");
    }
  } catch (error) {
    console.error("Upscaling error:", error);
    res.errorJson("Error during upscaling");
  }
};
