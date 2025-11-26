const { loadImage, createCanvas } = require("canvas");
const fs = require("fs-extra");
const axios = require("axios");

module.exports = {
  config: {
    name: "hack",
    version: "1.6.9",
    author: "Nazrul",
    countDown: 5,
    role: 0, 
    category: "fun",
    description: "This command generates a fake hacking image with the target user's Facebook profile picture, fake password, and login code. For entertainment purposes only.",
    guide: {
      en: "{pn} @mention | reply | UID | fb link\nSimulate hacking someone's account for fun."
    }
  },

  wrapText: async (ctx, name, maxWidth) => {
    return new Promise((resolve) => {
      if (ctx.measureText(name).width < maxWidth) return resolve([name]);
      if (ctx.measureText("W").width > maxWidth) return resolve(null);
      const words = name.split(" ");
      const lines = [];
      let line = "";
      while (words.length > 0) {
        let split = false;
        while (ctx.measureText(words[0]).width >= maxWidth) {
          const temp = words[0];
          words[0] = temp.slice(0, -1);
          if (split) words[1] = `${temp.slice(-1)}${words[1]}`;
          else {
            split = true;
            words.splice(1, 0, temp.slice(-1));
          }
        }
        if (ctx.measureText(`${line}${words[0]}`).width < maxWidth)
          line += `${words.shift()} `;
        else {
          lines.push(line.trim());
          line = "";
        }
        if (words.length === 0) lines.push(line.trim());
      }
      return resolve(lines);
    });
  },

  onStart: async function ({ api, event, args, message }) {
    const { threadID, messageReply, mentions } = event;
    const regExCheckURL = /^(http|https):\/\/[^ "]+$/;
    const { findUid } = global.utils;

    let userID;

    if (messageReply) {
      userID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
      userID = Object.keys(mentions)[0];
    } else if (args[0]) {
      if (regExCheckURL.test(args[0])) {
        try {
          userID = await findUid(args[0]);
        } catch (e) {
          return message.reply(`• Failed to get UID from link: ${e.message}`);
        }
      } else {
        userID = args[0];
      }
    } else {
      return message.reply("• Please reply to a message, mention someone, provide a UID, or give a Facebook profile link.");
    }

    const nameData = await api.getUserInfo(userID);
    const name = nameData[userID]?.name || "Unknown User";

    const steps = [
      "• Target found process started...",
      `• Scanning Facebook UID: ${userID}...`,
      "• Extracting user account data...",
      "• Cracking password encryption...",
      "• Uploading data to darkweb...",
      "• Hack successful! Preparing report..."
    ];

    const msgStep = await api.sendMessage(steps[0], threadID);
    const msgID = msgStep.messageID;

    for (let i = 1; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 1200));
      await api.editMessage(steps[i], msgID);
    }

    await new Promise((r) => setTimeout(r, 2000));
    await api.unsendMessage(msgID);

    const pass = `${Math.random().toString(36).slice(-5)}#${Math.floor(Math.random() * 999)}`;
    const code = `${Math.floor(100000 + Math.random() * 900000)}`;

    const pathImg = __dirname + "/cache/background.png";
    const pathAvt1 = __dirname + "/cache/Avtmot.png";
    const backgroundURL = "https://drive.google.com/uc?id=1RwJnJTzUmwOmP3N_mZzxtp63wbvt9bLZ";

    const avatar = (
      await axios.get(
        `https://graph.facebook.com/${userID}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )
    ).data;
    fs.writeFileSync(pathAvt1, Buffer.from(avatar, "utf-8"));

    const bg = (await axios.get(backgroundURL, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathImg, Buffer.from(bg, "utf-8"));

    const baseImage = await loadImage(pathImg);
    const baseAvt1 = await loadImage(pathAvt1);
    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx.font = "400 23px Arial";
    ctx.fillStyle = "#1878F3";
    ctx.textAlign = "start";

    const lines = await this.wrapText(ctx, name, 1160);
    ctx.fillText(lines.join("\n"), 200, 497);
    ctx.drawImage(baseAvt1, 83, 437, 100, 101);

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);
    fs.removeSync(pathAvt1);

    return api.sendMessage(
      {
        body: `• Hack Report\n• userID: ${userID}\n• Password: ${pass}\n• Login Code: ${code} (expires in 10 minutes)\n• ( if pass is wrong use login code instead )`,
        attachment: fs.createReadStream(pathImg),
      },
      threadID,
      () => fs.unlinkSync(pathImg)
    );
  }
};
