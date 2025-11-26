const axios = require("axios");

async function getStreamFromURL(url) {
  try {
    const response = await axios.get(url, { responseType: "stream" });
    return response.data;
  } catch (error) {
    console.error("❌ Error getting stream from URL:", error.message);
    return null;
  }
}

async function fetchTikTokVideos(query) {
  try {
    const response = await axios.get(`https://mahi-apis.onrender.com/api/tiktok?search=${encodeURIComponent(query)}`);
    return response.data?.data || [];
  } catch (error) {
    console.error("❌ Error fetching TikTok videos:", error.message);
    return [];
  }
}

module.exports = {
  config: {
    name: "fyp",
    aliases: ["fy"],
    version: "1.6.1",
    author: "Rexy",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Search TikTok anime edit videos",
    },
    longDescription: {
      en: "Search and download TikTok anime edit videos using your query.",
    },
    category: "fun",
    guide: {
      en: "{p}{n} [search query]",
    },
  },

  onStart: async function ({ api, event, args }) {
    try {
      api.setMessageReaction("😽", event.messageID, () => {}, true);

      const query = args.join(" ");
      if (!query) {
        return api.sendMessage("🦆 Please provide a search query.", event.threadID, event.messageID);
      }

      const videos = await fetchTikTokVideos(query);
      if (!videos || videos.length === 0) {
        return api.sendMessage(`❌ No videos found for query: ${query}.`, event.threadID, event.messageID);
      }

      // Pick a random video
      const selectedVideo = videos[Math.floor(Math.random() * videos.length)];
      const videoUrl = selectedVideo?.video;
      const title = selectedVideo?.title || "No title available";

      if (!videoUrl) {
        return api.sendMessage("🦆💨 Error: Video URL not found in API response.", event.threadID, event.messageID);
      }

      const videoStream = await getStreamFromURL(videoUrl);
      if (!videoStream) {
        return api.sendMessage("🦆💨 Failed to download video stream. Try again later.", event.threadID, event.messageID);
      }

      await api.sendMessage(
        {
          body: `😘 here is your video baby `,
          attachment: videoStream,
        },
        event.threadID,
        event.messageID
      );

    } catch (error) {
      console.error("🦆 Command Error:", error);
      api.sendMessage("🦆 An unexpected error occurred. Please try again later.", event.threadID, event.messageID);
    }
  },
};
