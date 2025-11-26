const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const apiUrl = "https://www.noobs-apis.run.place";

module.exports.config = {
  name: "ytb",
  aliases: ["ytv", "youtube"],
  version: "1.6.9",
  author: "Nazrul",
  role: 0,
  description: "Search or download YouTube videos in mp3/mp4 format.",
  category: "media",
  countDown: 7,
  guide: {
    en: `{pn} -s [query] | {pn} -i [url] | {pn} -dl [url] | {pn} -mp3 [url/query] | {pn} -mp4 [url/query]`
  }
};

module.exports.onStart = async function ({ message, event, args }) {
  if (!args[0]) return message.reply("• Please provide a valid argument.");
  const input = args.join(" ");

  const ytRegex = /https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/\S+/gi;
  let videoUrl =
    event.messageReply?.body?.match(ytRegex)?.[0] ||
    input.match(ytRegex)?.[0] ||
    null;

  const directFormat = input.match(/-(mp3|mp4|m|music|a|audio|song|sing|v|video|vd)\s+(.+)/i);
  if (directFormat) {
    const formatKey = directFormat[1].toLowerCase();
    const queryOrUrl = directFormat[2].trim();
    const format =
      ["mp3", "m", "music", "a", "audio", "song", "sing"].includes(formatKey) ? "mp3" : "mp4";
    return directDownload(message, event, queryOrUrl, format);
  }

  const type =
    input.includes("-s") || input.includes("search")
      ? "search"
      : /-(dl|download|d)/i.test(input)
      ? "download"
      : input.includes("-i") || input.includes("info")
      ? "info"
      : null;

  try {
    if (type === "search") {
      const query = input.replace(/-s|search/gi, "").trim();
      if (!query) return message.reply("• Please enter a search query!");
      await searchVideo(message, event, query);
    } else if (type === "download") {
      const url = videoUrl || input.replace(/-dl|download|-d/gi, "").trim();
      if (!url) return message.reply("• Please enter a valid YouTube URL or reply with one!");
      await downloadVideo(message, event, url);
    } else if (type === "info") {
      const url = videoUrl || input.replace(/-i|info/gi, "").trim();
      if (!url) return message.reply("• Please provide a YouTube link for info or reply with one!");
      await videoInfo(message, event, url);
    } else {
      return message.reply("• Invalid argument!");
    }
  } catch (err) {
    message.reaction("❌", event.messageID);
  }
};

async function directDownload(message, event, queryOrUrl, format) {
  await message.reaction("⏳", event.messageID);
  try {
    let url = queryOrUrl;
    if (!/^https?:\/\//i.test(queryOrUrl)) {
      const searchRes = await axios.get(`${apiUrl}/nazrul/youtube?type=s&query=${encodeURIComponent(queryOrUrl)}`);
      const data = searchRes.data.results?.data || [];
      if (!data.length) return message.reply("• No search results found!");
      url = data[0].url;
    }
    const res = await axios.get(`${apiUrl}/nazrul/youtube?type=${format}&url=${encodeURIComponent(url)}`);
    const title = res.data.title || "video";
    const fileUrl = res.data.download_url || res.data.downloads?.data?.fileUrl;
    if (!fileUrl) return message.reply("• Failed to get download URL!");
    const fileRes = await axios.get(fileUrl, { responseType: "arraybuffer" });
    const ext = format === "mp3" ? ".mp3" : ".mp4";
    const filePath = path.join(__dirname, `${title.replace(/[^\w\s]/g, "")}${ext}`);
    fs.writeFileSync(filePath, fileRes.data);
    await message.reaction("✅", event.messageID);
    await message.reply({ body: `✅ ${title}\nFormat: ${format.toUpperCase()}`, attachment: fs.createReadStream(filePath) });
    fs.unlinkSync(filePath);
  } catch (err) {
    message.reaction("❌", event.messageID);
  }
}

async function searchVideo(message, event, query) {
  await message.reaction("⏳", event.messageID);
  try {
    const res = await axios.get(`${apiUrl}/nazrul/youtube?type=s&query=${encodeURIComponent(query)}`);
    const data = res.data.results?.data || [];
    if (!data.length) return message.reply("• No search results found!");
    let text = "✅ Here's Search Results\n\n";
    const attachments = [];
    for (let i = 0; i < Math.min(data.length, 10); i++) {
      const v = data[i];
      text += `~×| ${i + 1}. ${v.title}\n• Duration: ${v.duration || "N/A"}\n• Channel: ${v.channelName || "Unknown"}\n• ${v.url}\n\n`;
      const thumbPath = path.join(__dirname, `thumb_${i + 1}.jpg`);
      const writer = fs.createWriteStream(thumbPath);
      const img = (await axios.get(v.thumbnails[0].url, { responseType: "stream" })).data;
      img.pipe(writer);
      await new Promise(r => writer.on("finish", r));
      attachments.push(fs.createReadStream(thumbPath));
    }
   text += "• Reply with the number and use type `-a/-mp3/-m/-audio/-mp4/-video/-v` to get.\n Ex: 1 -mp4.";
    await message.reaction("✅", event.messageID);
    message.reply({ body: text, attachment: attachments }, (err, info) => {
      if (err) return;
      global.GoatBot.onReply.set(info.messageID, {
        commandName: "ytb",
        type: "search",
        messageID: info.messageID,
        author: event.senderID,
        results: data
      });
    });
  } catch (err) {
    message.reaction("❌", event.messageID);
  }
}

async function downloadVideo(message, event, url) {
  await message.reaction("⏳", event.messageID);
  try {
    const mp4Res = await axios.get(`${apiUrl}/nazrul/youtube?type=mp4&url=${encodeURIComponent(url)}`);
    const mp3Res = await axios.get(`${apiUrl}/nazrul/youtube?type=mp3&url=${encodeURIComponent(url)}`);
    const video = mp4Res.data;
    const audio = mp3Res.data;
    const caption = `✅ Title: ${video.title}\n• Name: ${video.userInfo?.name || "Unknown"}\n• Views: ${video.mediaStats?.viewsCount || "N/A"}\n\nReply:\n1️ Audio (mp3)\n2️ Video (mp4)`;
    const thumbPath = path.join(__dirname, "thumbnail.jpg");
    const writer = fs.createWriteStream(thumbPath);
    const thumb = (await axios.get(video.thumbnail, { responseType: "stream" })).data;
    thumb.pipe(writer);
    await new Promise(r => writer.on("finish", r));
    await message.reaction("✅", event.messageID);
    message.reply({ body: caption, attachment: fs.createReadStream(thumbPath) }, (err, info) => {
      if (err) return;
      global.GoatBot.onReply.set(info.messageID, {
        commandName: "ytb",
        type: "download",
        author: event.senderID,
        urls: {
          mp3: audio.download_url,
          mp4: video.downloads?.data?.fileUrl
        },
        title: video.title
      });
    });
  } catch (err) {
    message.reaction("❌", event.messageID);
  }
}

async function videoInfo(message, event, url) {
  await message.reaction("⏳", event.messageID);
  try {
    const res = await axios.get(`${apiUrl}/nazrul/youtube?type=info&url=${encodeURIComponent(url)}`);
    const data = res.data?.video;
    if (!data || !data.video) return message.reply("❌ Failed to fetch video info!");
    const v = data.video;
    const c = data.channel;
    const duration = v.duration.replace("PT", "").replace("H", ":").replace("M", ":").replace("S", "");
    const info = `✅ ${v.title}\n\n•× Channel: ${c.title || "Unknown"}\n•× Subscribers: ${c.subscriberCount || "N/A"}\n•× Total Videos: ${c.videoCount || "N/A"}\n•× Views: ${v.viewCount || "N/A"}\n•× Likes: ${v.likeCount || "N/A"}\n•× Comments: ${v.commentCount || "N/A"}\n•× Duration: ${duration || "N/A"}\n•× Tags: ${v.tags?.slice(0, 8).join(", ") || "No tags"}\n\n•× Uploaded by: ${c.title}`;
    const thumbUrl = v.thumbnails?.maxres?.url || v.thumbnails?.high?.url;
    const thumbPath = path.join(__dirname, "video_info_thumb.jpg");
    const writer = fs.createWriteStream(thumbPath);
    const img = (await axios.get(thumbUrl, { responseType: "stream" })).data;
    img.pipe(writer);
    await new Promise(r => writer.on("finish", r));
    await message.reaction("✅", event.messageID);
    await message.reply({ body: info, attachment: fs.createReadStream(thumbPath) });
    fs.unlinkSync(thumbPath);
  } catch (err) {
    message.reaction("❌", event.messageID);
  }
};

module.exports.onReply = async function ({ event, message, Reply }) {
  try {
    const { type, results } = Reply;
    if (type === "search") {
      const body = event.body.trim().toLowerCase();
      const match = body.match(/^(\d+)(?:\s*-\s*(mp3|mp4|m|music|a|audio|song|sing|v|video|vd))?$/i);
      if (!match) return message.reply("• Invalid reply format. Use: 1 -mp3 or 2 -mp4");
      const index = parseInt(match[1]) - 1;
      const formatKey = (match[2] || "mp3").toLowerCase();
      const format =
        ["mp3", "m", "music", "a", "audio", "song", "sing"].includes(formatKey) ? "mp3" : "mp4";
      const video = results[index];
      if (!video) return message.reply("• Invalid number!");
      await directDownload(message, event, video.url, format);
    }
    if (type === "download") {
      const choice = event.body.trim().toLowerCase();
      const format =
        choice === "1" ||
        /(mp3|m|music|a|audio|song|sing)/i.test(choice)
          ? "mp3"
          : "mp4";
      const fileUrl = format === "mp3" ? Reply.urls.mp3 : Reply.urls.mp4;
      const res = await axios.get(fileUrl, { responseType: "arraybuffer" });
      const ext = format === "mp3" ? ".mp3" : ".mp4";
      const filePath = path.join(__dirname, `${Reply.title.replace(/[^\w\s]/g, "")}${ext}`);
      fs.writeFileSync(filePath, res.data);
      await message.reply({ body: `✅ ${Reply.title}\nFormat: ${format.toUpperCase()}`, attachment: fs.createReadStream(filePath) });
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    message.reaction("❌", event.messageID);
  }
};
