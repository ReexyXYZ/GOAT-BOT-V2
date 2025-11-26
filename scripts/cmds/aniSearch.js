const a = require("axios");

module.exports = {
  config: {
    name: "aniSearch",
    aliases: ["animeSearch", "anisearch"],
    version: "1.6.9",
    author: "Nazrul",
    role: 0,
    description: "Search for anime videos",
    category: "anime",
    countDown: 5,
    guide: { en: "{pn} anime name" }
  },

  onStart: async ({ api, event, args }) => {
    if (!args.length) return api.sendMessage("Provide an anime name.", event.threadID, event.messageID);

    try {
      const { data } = await a.get(`https://www.noobs-apis.run.place/nazrul/aniSearch`, { params: { query: args.join(" ") } });
      const url = data.videoUrl;

      if (url) {
        api.sendMessage(
          { body: "✅ Here's your anime video!", attachment: await global.utils.getStreamFromURL(url) },event.threadID,event.messageID);
      } else {
        api.sendMessage("No videos found.", event.threadID, event.messageID);
      }
    } catch (e) {
      api.sendMessage(`error: ${e.message}`, event.threadID, event.messageID);
    }
  } 
};
