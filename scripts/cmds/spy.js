 const axios = require("axios");

module.exports = {
  config: {
    name: "spy",
    aliases: ["userinfo", "who", "information", "stalk"],
    version: "1.6.9",
    role: 0,
    author: "♡ Nazrul ♡",
    shortDescription: "Get user information",
    longDescription: "Get user all information or user profile pic",
    category: "information",
    countDown: 5,
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    const uid1 = event.senderID;
    const uid2 = Object.keys(event.mentions)[0];
    let uid;

    if (args[0]) {
      if (/^\d+$/.test(args[0])) {
        uid = args[0];
      } else {
        const match = args[0].match(/profile\.php\?id=(\d+)/);
        if (match) {
          uid = match[1];
        }
      }
    }

    if (!uid) {
      uid = event.type === "message_reply" ? event.messageReply.senderID : uid2 || uid1;
    }

    const userInfo = await api.getUserInfo(uid);
    const avatarUrl = await usersData.getAvatarUrl(uid);

    let genderText;
    switch (userInfo[uid].gender) {
      case 1:
        genderText = "👧 Girl";
        break;
      case 2:
        genderText = "👦 Boy";
        break;
      default:
        genderText = "🌈 Other";
    }

    const money = (await usersData.get(uid)).money;
    const allUser = await usersData.getAll();
    const rank = allUser.slice().sort((a, b) => b.exp - a.exp).findIndex(user => user.userID === uid) + 1;
    const moneyRank = allUser.slice().sort((a, b) => b.money - a.money).findIndex(user => user.userID === uid) + 1;

    const position = userInfo[uid].type;
    
    let senderName = event.senderName || "Unknown";
    if (senderName === "Unknown") {
      const senderInfo = await api.getUserInfo(uid1);
      senderName = senderInfo[uid1].name || "Unknown";
    }

    const userInformation = `
╭─────【 𝑈𝑆𝐸𝑅 𝐼𝑁𝐹𝑂 】─────
│
🌟 ♡ Name: ${userInfo[uid].name}
🔍 ♡ Gender: ${genderText}
🆔 ♡ UID: ${uid}
🎓 ♡ Class: ${position ? position.toUpperCase() : "Normal User"}
💼 ♡ Username: ${userInfo[uid].vanity ? userInfo[uid].vanity : "None"}
📜 ♡ Profile URL: ${userInfo[uid].profileUrl}
🎂 ♡ Birthday: ${userInfo[uid].isBirthday !== false ? userInfo[uid].isBirthday : "Private"}
🗣️ ♡ Nickname: ${userInfo[uid].alternateName || "None"}
🤝 ♡ Friend with Bot: ${userInfo[uid].isFriend ? "Yes" : "No"}
╰─────────────────────

╭─────【 𝑀𝑜𝑟𝑒 𝐼𝑛𝑓𝑜 】─────
│
💰 ♡ Money: $${formatMoney(money)}
🏆 ♡ Rank: #${rank}/${allUser.length}
💸 ♡ Money Rank: #${moneyRank}/${allUser.length}
│
👤 ♡ Command used by: ${senderName}`;

    message.reply({
      body: userInformation,
      attachment: await global.utils.getStreamFromURL(avatarUrl),
    });
  },
};

function formatMoney(num) {
  const units = ["", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "N", "D"];
  let unit = 0;
  while (num >= 1000 && ++unit < units.length) num /= 1000;
  return num.toFixed(1).replace(/\.0$/, "") + units[unit];
}
