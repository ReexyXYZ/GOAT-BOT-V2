const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "pair",
    author: "gpt",
    role: 0,
    countDown: 15,
    shortDescription: "Pair two users with style!",
    longDescription: "Creates an awesome pairing image with enhanced styling.",
    category: "love",
    guide: "{pn}",
  },
  onStart: async function ({ api, event }) {
    const cacheDir = __dirname + "/cache";
    const pathImg = cacheDir + "/background.png";
    const pathAvt1 = cacheDir + "/Avtmot.png";
    const pathAvt2 = cacheDir + "/Avthai.png";

    
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    const id1 = event.senderID;
    let name1 = "You";
    let name2 = "Partner";

    try {
      const userInfo1 = await api.getUserInfo(id1);
      name1 = userInfo1[id1].name;
    } catch (error) {
      console.error(`Failed to fetch name for user ID ${id1}:`, error);
    }

    const threadInfo = await api.getThreadInfo(event.threadID);
    const allUsers = threadInfo.userInfo;
    const gender1 = allUsers.find((u) => u.id === id1)?.gender;
    const botID = api.getCurrentUserID();

    const eligibleUsers = allUsers
      .filter(
        (u) =>
          (gender1 === "FEMALE" && u.gender === "MALE") ||
          (gender1 === "MALE" && u.gender === "FEMALE") ||
          !gender1,
      )
      .map((u) => u.id)
      .filter((id) => id !== id1 && id !== botID);

    const id2 = eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)];

    try {
      const userInfo2 = await api.getUserInfo(id2);
      name2 = userInfo2[id2].name;
    } catch (error) {
      console.error(`Failed to fetch name for user ID ${id2}:`, error);
    }

    const pairingChance = Math.floor(Math.random() * 100) + 1;
    const backgrounds = [
      "https://i.postimg.cc/zf4Pnshv/background2.png",
      "https://i.postimg.cc/zf4Pnshv/background2.png",
      "https://i.postimg.cc/zf4Pnshv/background2.png",
    ];
    const backgroundUrl =
      backgrounds[Math.floor(Math.random() * backgrounds.length)];

    const downloadImage = async (url, path) => {
      try {
        const response = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(path, Buffer.from(response.data, "utf-8"));
      } catch (error) {
        console.error(`Failed to download image from ${url}:`, error);
        throw error;
      }
    };

    try {
      await downloadImage(
        `https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        pathAvt1,
      );
      await downloadImage(
        `https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        pathAvt2,
      );
      await downloadImage(backgroundUrl, pathImg);
    } catch (error) {
      return api.sendMessage(
        "Failed to process images. Please try again later.",
        event.threadID,
        event.messageID,
      );
    }

    try {
      const background = await loadImage(pathImg);
      const avatar1 = await loadImage(pathAvt1);
      const avatar2 = await loadImage(pathAvt2);

      const canvas = createCanvas(background.width, background.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const createGradientBorder = (x, y, radius, avatar) => {
        const gradient = ctx.createRadialGradient(
          x,
          y,
          radius,
          x,
          y,
          radius + 15,
        );
        gradient.addColorStop(0, "#FF1493");
        gradient.addColorStop(1, "#FFD700");

        ctx.beginPath();
        ctx.arc(x, y, radius + 15, 0, Math.PI * 2, true);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, x - radius, y - radius, radius * 2, radius * 2);
        ctx.restore();
      };

      createGradientBorder(250, 300, 150, avatar1);
      createGradientBorder(950, 300, 150, avatar2);

      ctx.fillStyle = "#FF6347";
      ctx.font = "80px Arial";
      ctx.textAlign = "center";
      ctx.fillText("♡", canvas.width / 2, 340);

      const gradientText = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradientText.addColorStop(0, "#FF69B4");
      gradientText.addColorStop(1, "#FFD700");

      ctx.fillStyle = gradientText;
      ctx.font = "50px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(name1, 250, 510);
      ctx.fillText(name2, 950, 510);
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 8;
      ctx.fillText(`💙`, canvas.width / 2, 510);

      ctx.fillStyle = "#FF1493";
      ctx.font = "40px Arial, sans-serif";
      ctx.fillText(`Pairing Chance: ${pairingChance}%`, canvas.width / 2, 565);

      const imageBuffer = canvas.toBuffer();
      fs.writeFileSync(pathImg, imageBuffer);
      fs.removeSync(pathAvt1);
      fs.removeSync(pathAvt2);

      return api.sendMessage(
        {
          body: `💞✨ Love Matched! ✨💞 ${name1} 💌 Embarking on a magical journey with ${name2}. 🌟 The stars align with a pairing chance of ${pairingChance}%! 🦋`,
          mentions: [{ tag: name2, id: id2 }],
          attachment: fs.createReadStream(pathImg),
        },
        event.threadID,
        () => fs.unlinkSync(pathImg),
        event.messageID,
      );
    } catch (error) {
      console.error("Failed to create pairing image:", error);
      return api.sendMessage(
        "An error occurred while creating the pairing image. Please try again later.",
        event.threadID,
        event.messageID,
      );
    }
  },
};
