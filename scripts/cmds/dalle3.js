module.exports = {
  config: {
    name: "dalle3",
    aliases: ["d3","de3"],
    version: "1.6.9",
    author: "Nazrul",
    countDown: 10,
    role: 0,
    description: "Generate image using DALLE-3.",
    category: "ai image",
    usePrefix: true,
    isPremium: false,
    requiredMoney: 500,
    guide: {
      en: "{pn} [prompt] --ar [aspect]\nExample: {pn} A Cat --ar 16:9"
    }
  },

  onStart: async function ({ message, event,  args }) {
    if (!args[0]) {
      return message.reply(`• Please provide a prompt.\nExample: dalle3 A Cat --ar 16:9`);
    }

    const fullInput = args.join(" ");
    const aspectMatch = fullInput.match(/--ar\s+(\d+:\d+)/);
    const aspect = aspectMatch ? aspectMatch[1] : "1:1";
    const basePrompt = fullInput.replace(/--ar\s+\d+:\d+/, "").trim();

    const apiUrl = (await require('axios').get("https://raw.githubusercontent.com/nazrul4x/Noobs/main/Apis.json")).data.m;

   message.reaction("⏳",event.messageID);

    try {
      const res = await require("axios").get(
        `${apiUrl}/nazrul/dalle3?prompt=${encodeURIComponent(basePrompt)}&ratio=${aspect}`
      );
      const imgUrl = res.data[0]?.result?.info?.imageUrl?.[0];
      if (!imgUrl) throw new Error("• No image url returned!");

      message.reaction("✅",event.messageID);
      await message.reply({
        body: `✅ Here’s your generated DALLE-3 image!`,
        attachment: await global.utils.getStreamFromURL(imgUrl)
      });
    } catch (err) {
      console.error("Dalle3 error:", err.message || err);
      message.reaction(" ❌",event.messageID);
    }
  }
};
