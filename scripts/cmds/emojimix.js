 const axios = require("axios");
const fs = require("fs");

const baseApiUrl = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/nazrul4x/Noobs/main/Apis.json"
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "emojimix",
   aliases: ["mix","emix"],
    version: "1.6.9",
    author: "♡ Nazrul ♡",
    countDown: 5,
    role: 0,
    description: "Mix emoji",
    category: "fun with emoji"
  },

  onStart: async function ({ message, args, getLang }) {
    if (!args[0]) return message.reply("Please enter the first emoji.");
    if (!args[1]) return message.reply("Please enter the second emoji.");

    const emoji1 = args[0];
    const emoji2 = args[1];
    const readStream = [];

    try {
      const response = await axios.get(`${await baseApiUrl()}/nazrul/emojimix`, {
        params: { emoji1, emoji2 },
        responseType: "stream"
      });

      const path = `emojimix${Date.now()}.png`;

      
      const writer = require('fs').createWriteStream(path);
      response.data.pipe(writer);

      writer.on('finish', () => {
        message.reply({ body: `✅ Here's your mixed emoji ✨`, attachment: fs.createReadStream(path) });
      });

      writer.on('error', () => {
        message.reply("An error occurred while mixing emojis.");
      });

    } catch (error) {
      console.error(error);
      message.reply("An error occurred while mixing emojis.");
    }
  }
};
