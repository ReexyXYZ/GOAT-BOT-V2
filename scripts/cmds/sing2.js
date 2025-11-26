const axios = require("axios");
const fs = require("fs");
const yts = require("yt-search");
const api1 = "https://www.not-asif.top";
const api2 = "https://www.noobs-api.rf.gd/dipto";

module.exports = {
  config: {
    name: "sing2",
    version: "1.1.5",
    aliases: ["music2", "play2", "song2"],
    author: "dipto",
    countDown: 5,
    role: 0,
    description: {
      en: "Download audio from YouTube",
    },
    category: "media",
    guide: {
      en:
        "{pn} [<song name>|<song link>|<song id>|<reply to a video>]"
      + "\n{pn} -r [<song name>|<song id>]"
      + "\n  Example:"
      + "\n{pn} yad"
      + "\n{pn} -r yad" 
    },
  },
  onStart: async ({ api, args, event, commandName, message }) => {
    const checkurl =
      /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
    const isUrl = checkurl.test(args[0]);
    const argString = args.join(" ");

    if (args[0]?.toLowerCase() === "-r" || args[0]?.toLowerCase() === "random") {
      if (args.length <= 1) {
        return message.reply("Please provide a songName to search a song.");
      }

      try {
        const keyword = argString.replace(/-r|random/gi, "").trim();
        message.react("⏳");
        const st = Date.now();
        const searchResults = await yts(keyword);
        const r = Math.floor(Math.random() * 5);
        const musicUrl = searchResults.videos[r].url;
         console.log('Fetching:', `${api1}/ytdl?url=${musicUrl}&type=mp3`);
        const rsp = await axios.get(`${api1}/ytdl?url=${musicUrl}&type=mp3`, {
          timeout: 60000, // 1 minutes
        });
       const { result, title } = rsp.data.data;
       const et = Date.now();
       message.react("✅");
        await api.sendMessage(
           {
            body: `• Title: ${title}\n• Time Taken: ${((et - st) / 1000)?.toFixed(2)}s`,
            attachment: await global.utils.getStreamFromURL(result,  et+'.mp3'),
          },
          event.threadID,
          event.messageID,
        );
      } catch (error) {
        console.log(error);
        message.react("❌");
        message.reply(error.message);
      }
    } else if (event.type === "message_reply") {
      const dip = event.messageReply?.attachments[0]?.url;
      if (!dip) {
        return api.sendMessage(
          "Please reply to a video.",
          event.threadID,
          event.messageID,
        );
      }

      try {
        message.react("⏳");
        const st = Date.now();
        const name = (
          await axios.get(
            `${api2}/songFind?url=${encodeURIComponent(dip)}`,
          )
        ).data;
        const stitle = name?.track?.title;
        const url = name?.track?.hub?.actions?.[1]?.uri;

        if (url) {
          let et = Date.now();
          message.react("✅");
          return message.reply({
            body: `• Title: ${stitle}\nTime Taken: ${((et - st) / 1000)?.toFixed(2)}s`,
            attachment: await global.utils.getStreamFromURL(url),
          });
        }

        let res = (
          await axios.get(
            `${api2}/ytFullSearch?songName=${stitle}`,
          )
        ).data;
        const infoChoice = res[1];
        const idvideo = infoChoice.id;

        console.log('Fetching:', `${api1}/ytdl?url=https://youtu.be/${idvideo}&type=mp3`);
        const rsp = await axios.get(`${api1}/ytdl?url=https://youtu.be/${idvideo}&type=mp3`, {
          timeout: 60000, // 1 minutes
        });
        const { result, title } = rsp.data.data;
        const et = Date.now();
        message.react("✅");
        return await api.sendMessage(
          {
            body: `• Title: ${title}\n• Time Taken: ${((et - st) / 1000)?.toFixed(2)}s`,
            attachment: await global.utils.getStreamFromURL(result),
          },
          event.threadID,
          event.messageID,
        );
      } catch (error) {
        console.log(error);
        message.react("❌");
        return api.sendMessage(
          "Failed to convert video into link.",
          event.threadID,
          event.messageID,
        );
      }
    } else if (isUrl) {
      message.react("⏳");
      let st = Date.now();
      const videoID = args[0].match(checkurl)?.[1];
      try {
        console.log('Fetching:', `${api1}/ytdl?url=https://youtu.be/${videoID}&type=mp3`);
        const rsp = await axios.get(`${api1}/ytdl?url=https://youtu.be/${videoID}&type=mp3`, {
          timeout: 60000, // 1 minutes
        });
       const { result, title } = rsp.data.data;
        let et = Date.now();
        message.react("✅");
        return await api.sendMessage(
            {
            body: `• Title: ${title}\n• Time Taken: ${((et - st) / 1000)?.toFixed(2)}s`,
            attachment: await global.utils.getStreamFromURL(result),
          },
          event.threadID,
          event.messageID,
        );
      } catch (error) {
        console.log(error);
        message.react("❌");
        message.reply("An error occurred while downloading the song.");
      }
    } else if (args[0]) {
      try {
        let keyWord = argString.includes("?feature=share")
          ? argString.replace("?feature=share", "")
          : argString;
        const maxResults = 6;

        const res = (
          await axios.get(
            `${api2}/ytFullSearch?songName=${keyWord}`,
          )
        ).data.slice(0, maxResults);

        if (res.length === 0) {
          return api.sendMessage(
            `⭕ No search results match the keyword: ${keyWord}`,
            event.threadID,
            event.messageID,
          );
        }

        let msg = "";
        const thumbnails = [];
        res.forEach((info, index) => {
          thumbnails.push(diptoSt(info.thumbnail, "photo.jpg"));
          msg += `${index + 1}. ${info.title}\nTime: ${info.time}\nChannel: ${info.channel.name}\n\n`;
        });

        return api.sendMessage(
          {
            body: msg + "Reply to this message with a number you want to listen to.",
            attachment: await Promise.all(thumbnails),
          },
          event.threadID,
          (err, info) => {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: event.senderID,
              res,
            });
          },
          event.messageID,
        );
      } catch (error) {
        console.log(error);
        return api.sendMessage(
          "❌ An error occurred while searching for the song.",
          event.threadID,
          event.messageID,
        );
      }
    } else {
      return api.sendMessage(
        "Please provide a valid input: song name, URL, or reply to a video.",
        event.threadID,
        event.messageID,
      );
    }
  },
  onReply: async ({ event, api, Reply, message }) => {
try {
const { res } = Reply;
const choice = parseInt(event.body);
if (!isNaN(choice) && choice <= res.length && choice > 0) {
  message.react("⏳");
  const st = Date.now();
  const infoChoice = res[choice - 1];
  const idvideo = infoChoice.id;
console.log('Fetching:', `${api1}/ytdl?url=https://youtu.be/${idvideo}&type=mp3`);
const rsp = await axios.get(`${api1}/ytdl?url=https://youtu.be/${idvideo}&type=mp3`, {
  timeout: 60000, // 1 minutes
});
       const { result, title } = rsp.data.data;
api.unsendMessage(Reply.messageID);
    const et = Date.now();
message.react("✅");
    await  api.sendMessage({
            body: `• Title: ${title}\n• Time Taken: ${((et - st) / 1000)?.toFixed(2)}s`,
            attachment: await global.utils.getStreamFromURL(result),
          },event.threadID ,
  // ()=>fs.unlinkSync('audio.mp3') ,
    event.messageID)

} else {
  api.sendMessage("Invalid choice. Please enter a number between 1 and 6.",event.threadID,event.messageID);
}
} catch (error) {
  console.log(error);
  message.react("❌");
  api.sendMessage("⭕ Sorry, audio size was less than 26MB",event.threadID,event.messageID)
}   
}
};

async function diptoSt(url, pathName) {
  try {
    const response = await axios.get(url, {
      responseType: "stream",
    });
    response.data.path = pathName;
    return response.data;
  } catch (err) {
    throw err;
  }
}
