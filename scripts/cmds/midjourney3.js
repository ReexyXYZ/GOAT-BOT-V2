const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

module.exports = {
  config: {
    name: 'midjourney3',
    aliases: ["mj3","mjj"],
    version: '1.6.9',
    author: 'Nazrul',
    countDown: 15,
    role: 0,
    description: 'Generate Image using Midjourney!',
    category: 'ai',
    usePrefix: true,
    isPremium: false,
    guide: { en: "{pn} [prompt] --ar [aspect]" }
  },

  onStart: async function ({ event, args, message }) {
    if (!args[0]) return message.reply(`• Provide a prompt.`);

    const fullInput = args.join(" ");
    const aspectMatch = fullInput.match(/--ar\s+(\d+:\d+)/);
    const aspect = aspectMatch ? aspectMatch[1] : "1:1";
    const basePrompt = fullInput.replace(/--ar\s+\d+:\d+/, "").trim();
    const apiUrl = (await axios.get("https://raw.githubusercontent.com/nazrul4x/Noobs/main/Apis.json")).data.m;
    message.reaction("⏳",event.messageID);
    try {
      const res = await axios.get(`${apiUrl}/nazrul/midjourney-v2?prompt=${encodeURIComponent(basePrompt)}&ratio=${aspect}`);
      let images = res.data[0]?.result?.info?.imageUrl;

      if (!images) throw new Error("No imageUrl returned.");
      if (typeof images === "string") images = [images];
      if (images.length < 4) throw new Error("Not enough images received (need 4).");

      const loadedImages = await Promise.all(images.slice(0, 4).map(i => loadImage(i)));

      const w = Math.max(...loadedImages.map(i => i.width));
      const h = Math.max(...loadedImages.map(i => i.height));

      const canvas = createCanvas(w * 2, h * 2);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(loadedImages[0], 0, 0, w, h);
      ctx.drawImage(loadedImages[1], w, 0, w, h);
      ctx.drawImage(loadedImages[2], 0, h, w, h);
      ctx.drawImage(loadedImages[3], w, h, w, h);

      const fullImagePath = path.join(__dirname, `mj_grid_${event.threadID}.png`);
      fs.writeFileSync(fullImagePath, canvas.toBuffer('image/png'));

      message.reaction("✅",event.messageID);

      const msg = await message.reply({
        body: `✅ Process Completed!\n• Reply with 1, 2, 3, 4 to get your image.`,
        attachment: fs.createReadStream(fullImagePath)
      });

      global.GoatBot.onReply.set(msg.messageID, {
        commandName: this.config.name,
        author: event.senderID,
        gridPath: fullImagePath
      });

    } catch (err) {
      message.reply("❌ Error generating image.");
      message.reaction("❌",event.messageID);
    }
  },

  onReply: async function ({ event, Reply, message }) {
    const { author, gridPath } = Reply;
    if (event.senderID !== author) return;

    const choice = event.body.trim();
    if (!["1", "2", "3", "4"].includes(choice)) {
      return message.reply("• Invalid reply. Reply with 1, 2, 3, or 4.");
    }
    try {
      const gridImage = await loadImage(gridPath);
      const [w, h] = [gridImage.width / 2, gridImage.height / 2];
      const canvas = createCanvas(w, h);
      const ctx = canvas.getContext('2d');

      const positions = {
        "1": [0, 0],
        "2": [w, 0],
        "3": [0, h],
        "4": [w, h]
      };
      const [sx, sy] = positions[choice];
      ctx.drawImage(gridImage, sx, sy, w, h, 0, 0, w, h);

      const cropPath = path.join(__dirname, `mj_crop_${event.threadID}_${choice}.png`);
      fs.writeFileSync(cropPath, canvas.toBuffer('image/png'));
      message.reaction("✅",event.messageID);
      await message.reply({
        body: `✅ Here's your image No. ${choice}`,
        attachment: fs.createReadStream(cropPath)
      });

      setTimeout(() => {
        fs.unlink(cropPath, () => {});
        fs.unlink(gridPath, () => {});
      }, 3600000);

    } catch (err) {
      message.reply("❌ Failed to send the selected image.");
      message.reaction("❌",event.messageID);
    }
  }
};
