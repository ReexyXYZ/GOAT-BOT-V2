const axios = require("axios");
const fs = require("fs");
const path = require("path");

const apiUrl = "https://www.noobs-apis.run.place";

const extu = (text) => {
  const match = text?.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/\S+/gi);
  return match ? match[0] : null;
};

module.exports.config = {
  name: "song",
  aliases: ["songs", "musics"],
  version: "1.6.9",
  author: "Nazrul",
  role: 0,
  countDown: 9,
  category: "media",
  guide: { en: "{pn} [song name] or reply with a link" }
};

module.exports.onStart = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply } = event;
  const query = args.join(" ");
  const startTime = Date.now();
  let url = extu(messageReply?.body) || extu(query);

  if (!url && !query) {
    return api.sendMessage("Provide a song name or YouTube link.", threadID, messageID);
  }

  api.setMessageReaction("🦆", messageID, () => {}, true);

  try {
    if (!url) {
      const res = await axios.get(`${apiUrl}/nazrul/ytSearch`, { params: { query: query.trim() } });

      const results = res.data.data;
      if (!results.length) throw new Error("No results found.");

      const random = results[Math.floor(Math.random() * Math.min(3, results.length))];
      url = random.url;
    }

    const { data: mp3Data } = await axios.get(`${apiUrl}/nazrul/ytMp3x`, { params: { url } });

    if (!mp3Data?.url) throw new Error("Download link not found!");

    const filePath = path.join(__dirname, "song.mp3");
    const writer = fs.createWriteStream(filePath);
    const response = await axios.get(mp3Data.url, { responseType: "stream" });
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);

    await api.sendMessage({
      body: `🎶 Title: ${mp3Data.title || "Unknown Title"}\n⏱ Time taken: ${timeTaken}s`,
      attachment: fs.createReadStream(filePath)
    }, threadID, () => {
      fs.unlinkSync(filePath);
      api.setMessageReaction("✅", messageID, () => {}, true);
    }, messageID);

  } catch (err) {
    console.error("Error:", err);
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(`Error: ${err.message}`, threadID, messageID);
  }
};
