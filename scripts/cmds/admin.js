const { config } = global.GoatBot;
const { writeFileSync, existsSync } = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "admin",
    version: "2.0",
    author: "NTKhang",
    countDown: 5,
    role: 0,
    description: {
      en: "Manage admin roles: Add, remove, or list admins"
    },
    category: "box chat",
    guide: {
      en: `   {pn} [add | -a] <uid | @tag>: Add admin role to a user
                \n   {pn} [remove | -r] <uid | @tag>: Remove admin role from a user
                \n   {pn} [list | -l]: Display a list of all admins`
    }
  },

  langs: {
    en: {
      added: "✅ | Successfully added admin role for %1 users:\n%2",
      alreadyAdmin: "\n⚠ | %1 users are already admins:\n%2",
      missingIdAdd: "⚠ | Please provide a valid ID or tag to add admin role",
      removed: "✅ | Successfully removed admin role from %1 users:\n%2",
      notAdmin: "⚠ | %1 users are not admins:\n%2",
      missingIdRemove: "⚠ | Please provide a valid ID or tag to remove admin role",
      listAdmin: `👑 |  Bot Admins & Operators | 👑  
⎯⎯⎯⎯⎯⎯⎯⎯⎯    
%1  
⎯⎯⎯⎯⎯⎯⎯⎯⎯  
👒🎩 | Operator | 🎩👒
⎯⎯⎯⎯⎯⎯⎯⎯⎯    
%3  
⎯⎯⎯⎯⎯⎯⎯⎯⎯  `,
      protectMessage: "- Shut up nonsense! 😠 How dare you want to remove my boss from admin!",
      replyPromptAdd: "📩 | Reply to a user message to add them as an admin!",
      replyPromptRemove: "📩 | Reply to a user message to remove them from the admin list!",
      permissionError: "⚠ | You do not have permission to use this command.",
      usageList: "🪄 | Admin Command Usages:\n" +
        "{pn} [add | -a] <uid | @tag>: Add admin role to a user\n" +
        "{pn} [remove | -r] <uid | @tag>: Remove admin role from a user\n" +
        "{pn} [list | -l]: Display a list of all admins"
    }
  },

  onStart: async function({ message, args, usersData, event, getLang, globalData }) {
    const senderId = event.senderID;
    const configKey = "adminBot";
    const operatorKey = "operatorBot";
    

    function syncToConfig(adminConfig, operatorConfig) {
      config.adminBot = adminConfig;
      config.operatorBot = operatorConfig || [];
      const devPath = path.join(process.cwd(), "config.dev.json");
      const mainPath = path.join(process.cwd(), "config.json");
      
      try {
        const configPath = existsSync(devPath) ? devPath : existsSync(mainPath) ? mainPath : devPath;
        writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
      } catch (err) {
        console.error("❌ Failed to sync adminBot to config file:", err);
      }
    }
    

    let adminConfigData = await globalData.get(configKey);
    if (!adminConfigData) {
      await globalData.create(configKey, {
        data: config.adminBot || []
      });
      adminConfigData = await globalData.get(configKey);
    }
    
    let operatorConfigData = await globalData.get(operatorKey);
    if (!operatorConfigData) {
      await globalData.create(operatorKey, {
        data: config.operatorBot || []
      });
      operatorConfigData = await globalData.get(operatorKey);
    }
    
    const adminConfig = adminConfigData.data;
    const operatorConfig = operatorConfigData.data;
    const isAdmin = adminConfig.includes(senderId);

    const replyToUser = event.messageReply ? event.messageReply.senderID : null;

    if (args.length === 0) {
      return message.reply(getLang("usageList"));
    }


    syncToConfig(adminConfig, operatorConfig);

    switch (args[0]) {
      case "add":
      case "-a": {
        if (!isAdmin) {
          return message.reply(getLang("permissionError"));
        }

        if (args[1] || replyToUser) {
          let uids = [];
          if (replyToUser) {
            uids.push(replyToUser);
          } else if (Object.keys(event.mentions).length > 0) {
            uids = Object.keys(event.mentions);
          } else if (args[1]) {
            uids = args.filter(arg => !isNaN(arg));
          }

          const notAdminIds = [];
          const adminIds = [];
          for (const uid of uids) {
            if (adminConfig.includes(uid)) {
              adminIds.push(uid);
            } else {
              notAdminIds.push(uid);
            }
          }

          adminConfig.push(...notAdminIds);
          await globalData.set(configKey, { data: adminConfig });
          syncToConfig(adminConfig, operatorConfig);
          
          const getNames = await Promise.all(uids.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));

          return message.reply(
            (notAdminIds.length > 0 ? getLang("added", notAdminIds.length, getNames.map(({ uid, name }) => `• ${name}\n╰${uid}`).join("\n")) : "") +
            (adminIds.length > 0 ? getLang("alreadyAdmin", adminIds.length, adminIds.map(uid => `• ${uid}`).join("\n")) : "")
          );
        } else {
          return message.reply(getLang("missingIdAdd"));
        }
      }

      case "remove":
      case "-r": {
        if (!isAdmin) {
          return message.reply(getLang("permissionError"));
        }

        if (args[1] || replyToUser) {
          let uids = [];
          if (replyToUser) {
            uids.push(replyToUser);
          } else if (Object.keys(event.mentions).length > 0) {
            uids = Object.keys(event.mentions);
          } else {
            uids = args.filter(arg => !isNaN(arg));
          }

          const notAdminIds = [];
          const adminIds = [];
          for (const uid of uids) {
            if (uid === "61556512630729") {
              notAdminIds.push(uid);
            } else if (adminConfig.includes(uid)) {
              adminIds.push(uid);
            } else {
              notAdminIds.push(uid);
            }
          }

          if (notAdminIds.includes("61556512630729")) {
            return message.reply(getLang("protectMessage"));
          }

          for (const uid of adminIds) {
            if (uid !== "100049220893428") {
              const index = adminConfig.indexOf(uid);
              if (index > -1) {
                adminConfig.splice(index, 1);
              }
            }
          }

          await globalData.set(configKey, { data: adminConfig });
          syncToConfig(adminConfig, operatorConfig);

          const getNames = await Promise.all(adminIds.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));

          return message.reply(
            (adminIds.length > 0 ? getLang("removed", adminIds.length, getNames.map(({ uid, name }) => `• ${name}\n╰${uid}`).join("\n")) : "") +
            (notAdminIds.length > 0 ? getLang("notAdmin", notAdminIds.length, notAdminIds.map(uid => `• ${uid}`).join("\n")) : "")
          );
        } else {
          return message.reply(getLang("missingIdRemove"));
        }
      }

      case "list":
      case "-l": {
        const mainAdminId = "61556512630729";
        const getNames = await Promise.all(adminConfig.map(uid => usersData.getName(uid).then(name => ({ uid, name }))));

        const operators = [];
        const admins = [];
        const mainAdmin = [];

        getNames.forEach(({ uid, name }) => {
          if (uid === mainAdminId) {
            mainAdmin.push(`👑 ${name} (Owner)\n ╰${uid}`);
          } else if (operatorConfig.includes(uid)) {
            operators.push(`🛡️ ${name} (Operator) (${uid})`);
          } else {
            admins.push(`• ${name}\n╰${uid}`);
          }
        });


        const listMessage = getLang("listAdmin",
          mainAdmin.join("\n"),
          operators.join("\n"),
          admins.join("\n")
        );

        return message.reply(listMessage);
      }

      default:
        return message.SyntaxError();
    }
  }
};
