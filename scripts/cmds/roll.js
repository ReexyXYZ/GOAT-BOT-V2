const cmd = {
  config: {
    name: "dice",
    aliases: ["roll"],
    version: "1.5.0",
    author: "Rexy",
    category: "game",
    guide: {
      en: `{pn} <amount> — Roll the dice (min 100)
{pn} me/info [@mention/reply] — View dice stats
{pn} top — Top 15 users by wins
{pn} topmoney — Top 15 by total earned
{pn} lostmoney — Top 15 by money lost
{pn} rich — Top 15 richest users (balance)
{pn} history — Show your last 10 rolls
{pn} claim — Claim your daily bonus
{pn} reset [uid/@mention/reply] — Admin only reset user data
{pn} help — Show this help menu`
    },
    countDown: 5
  },

  onStart: async function ({ args, message, event, usersData, globalData }) {
    const { senderID: userID, mentions, messageReply } = event;
    const prefix = await global.utils.getPrefix(event.threadID);
    const now = Date.now();
    const { config } = global.GoatBot;

    const userData = await usersData.get(userID) || { money: 0, name: `User_${userID}` };
    const userName = userData.name || `User_${userID}`;

    let raw = await globalData.get("diceFullData");
    if (!raw) {
      await globalData.create("diceFullData", { data: {} });
      raw = { data: {} };
    }

    const diceData = raw.data || {};

    // Admin reset
    if (args[0] === "reset") {
      const isAdmin = userID === config?.adminBot || config?.adminBot?.includes(userID);
      if (!isAdmin) return message.reply("❌ Only bot Admin can use reset!");

      const targetID = Object.keys(mentions)[0] || (messageReply && messageReply.senderID) || args[1];
      if (!targetID) return message.reply("• Mention, reply, or provide UID to reset.");
      if (!diceData[targetID]) return message.reply("❌ No dice data found for that user.");

      diceData[targetID] = createEmptyUserData(diceData[targetID].name);
      await globalData.set("diceFullData", { data: diceData });
      return message.reply(`✅ Reset stats for ${diceData[targetID].name || `UID: ${targetID}`}`);
    }

    if (!diceData[userID]) diceData[userID] = createEmptyUserData(userName);
    let data = diceData[userID];

    // Daily reset
    const resetInterval = 5 * 60 * 60 * 1000;
    if (!data.lastPlayed || now - data.lastPlayed >= resetInterval) {
      data.todayLeft = 20;
      data.lastPlayed = now;
    }

    // Daily bonus
    if (args[0] === "claim") {
      const oneDay = 24 * 60 * 60 * 1000;
      if (now - (data.claimedBonus || 0) < oneDay)
        return message.reply(`❌ Already claimed!\nCome back in: ${formatDuration(oneDay - (now - data.claimedBonus))}`);
      const reward = 1000;
      await usersData.set(userID, { money: (userData.money || 0) + reward });
      data.claimedBonus = now;
      diceData[userID] = data;
      await globalData.set("diceFullData", { data: diceData });
      return message.reply(`✅ Claimed Daily Bonus: +${formatMoney(reward)}`);
    }

    // User stats
    if (["me", "info"].includes(args[0])) {
      const targetID = Object.keys(mentions)[0] || (messageReply && messageReply.senderID) || userID;
      if (!diceData[targetID]) return message.reply("❌ No data found for that user.");
      let tData = diceData[targetID];
      return message.reply(
        `🎲 Stats for ${tData.name}:\n` +
        `• Wins: ${tData.wins}\n• Losses: ${tData.losses}\n` +
        `• Total Win: ${formatMoney(tData.winAmount)}\n` +
        `• Total Lost: ${formatMoney(tData.lostAmount)}\n` +
        `• Win Streak: ${tData.streak}\n• Remaining: ${tData.todayLeft}/20\n` +
        `• Reset in: ${formatDuration(resetInterval - (now - tData.lastPlayed))}`
      );
    }

    // Roll history
    if (args[0] === "history") {
      const h = data.history?.slice(-10).map((r, i) => `${i + 1}. ${r}`) || [];
      return message.reply(`📜 Last ${h.length} Rolls:\n` + h.join("\n"));
    }

    if (data.todayLeft <= 0)
      return message.reply(`❌ Play limit reached!\nTry again in: ${formatDuration(resetInterval - (now - data.lastPlayed))}`);

    const bet = parseMoney(args[0]);
    if (!bet || bet < 100) return message.reply("• Minimum bet is 100!");
    if (bet > 500000000000000) return message.reply("• Maximum bet is 500T!");
    if (bet > (userData.money || 0)) return message.reply(`💸 Not enough money!\nBalance: ${formatMoney(userData.money || 0)}`);
    // Dice roll with 30% win / 70% loss
    const rand = Math.random(); // 0 to 1
    let multiplier = 0;
    let type = "loss";
    let roll = 0;

    if (rand < 0.3) {  // 30% chance to win
      roll = Math.floor(Math.random() * 5) + 2; // 2-6
      if (roll === 6) multiplier = 5;   // jackpot
      else if (roll >= 4) multiplier = 2; // big win
      else multiplier = 1; // small win
      type = roll === 6 ? "jackpot" : "win";
    } else {
      // 70% chance to lose
      roll = Math.floor(Math.random() * 6) + 1; // 1-6
      multiplier = 0;
      type = "loss";
    }

    const win = bet * multiplier;
    const newBalance = (userData.money || 0) - bet + win;

    // Update stats
    if (win > 0) {
      data.winAmount += win;
      data.streak++;
      data.wins++;
    } else {
      data.lostAmount += bet;
      data.streak = 0;
      data.losses++;
    }

    data.todayLeft--;
    data.lastPlayed = now;
    data.history.push(`${type.toUpperCase()} | Roll: ${roll} | Bet: ${formatMoney(bet)} | Win: ${formatMoney(win)} | New: ${formatMoney(newBalance)}`);
    if (data.history.length > 20) data.history.shift();

    diceData[userID] = data;
    await usersData.set(userID, { money: newBalance });
    await globalData.set("diceFullData", { data: diceData });

    return message.reply({
      body: createResponse(userName, roll, win, type, bet, newBalance),
      mentions: [{ id: userID, tag: userName }]
    });
  }
};

// Helper functions
function createEmptyUserData(name) {
  return {
    name,
    wins: 0,
    losses: 0,
    streak: 0,
    winAmount: 0,
    lostAmount: 0,
    todayLeft: 20,
    lastPlayed: 0,
    claimedBonus: 0,
    history: []
  };
}

function parseMoney(input) {
  if (!input) return NaN;
  const match = input.match(/^([\d.,]+)\s*([a-zA-Z]*)$/);
  if (!match) return NaN;
  const num = parseFloat(match[1].replace(/,/g, ""));
  const suffix = match[2]?.toLowerCase();
  const multipliers = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, qa: 1e15 };
  return num * (multipliers[suffix] || 1);
}

function formatMoney(amount) {
  if (amount < 1000) return `$${amount.toFixed(2)}`;
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa'];
  const exp = Math.floor(Math.log10(amount) / 3);
  const shortVal = (amount / Math.pow(1000, exp)).toFixed(2);
  return `$${shortVal}${suffixes[exp] || ''}`;
}

function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${h}h ${m}m ${s}s`;
}

function createResponse(name, roll, win, type, bet, newBalance) {
  const formattedWin = formatMoney(win);
  const formattedNewBalance = formatMoney(newBalance);

  if (win > 0) {
    if (type === "jackpot") return `🎉 JACKPOT! ${name} rolled a 6!\nBet: ${formatMoney(bet)}\nWin: ${formattedWin}\nNew Balance: ${formattedNewBalance}`;
    return `✅ BIG WIN! ${name} rolled ${roll}\nBet: ${formatMoney(bet)}\nWin: ${formattedWin}\nNew Balance: ${formattedNewBalance}`;
  }

  return `🦆Better luck next time!\n${name} rolled ${roll}\nLost: ${formatMoney(bet)}\nAvailable Balance: ${formattedNewBalance}`;
}

module.exports = cmd;
