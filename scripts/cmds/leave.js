const axios = require("axios");
const fs = require("fs-extra");
const request = require("request");
module.exports = {
  config: {
    name: "leave",
    aliases: ["out"],
    version: "1.0",
    author: "♡ 𝐍𝐚𝐳𝐫𝐮𝐥 ♡",
    countDown: 5,
    role: 1,
    shortDescription: "bot will leave gc",
    longDescription: "",
    category: "admin",
    guide: {
      vi: "{pn} [tid,blank]",
      en: "{pn} [tid,blank]"
    }
  },

  onStart: async function ({ api,event,args, message }) {
 var id;
 if (!args.join(" ")) {
 id = event.threadID;
 } else {
 id = parseInt(args.join(" "));
 }
 return api.sendMessage('𝙂𝙤𝙤𝙙 𝘽𝙮𝙚 𝙂𝙪𝙮𝙨 😷💫', id, () => api.removeUserFromGroup(api.getCurrentUserID(), id))
    }
  };
