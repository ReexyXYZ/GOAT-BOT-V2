const { config } = global.GoatBot;
const { writeFileSync, existsSync } = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "mainadmin",
    aliases: ["madmin"],
    version: "2.0",
    author: "Nazrul",
    countDown: 5,
    role: 2,
    description: {
      en: "Manage the main admin: Assign, revoke, or display main admin users.",
    },
    category: "admin",
    guide: {
      en: `   {pn} [add | -a] <uid | @tag>: Assign the main admin role to a user
                \n   {pn} [remove | -r] <uid | @tag>: Revoke the main admin role from a user
                \n   {pn} [list | -l]: Show the list of main admins`,
    },
  },

  langs: {
    en: {
      added: "✅ | Successfully assigned the main admin role to %1 user(s):\n%2",
      alreadyAdmin: "\n⚠ | %1 user(s) already have the main admin role:\n%2",
      missingIdAdd: "⚠ | Provide a valid ID or tag to assign as main admin.",
      removed: "✅ | Successfully revoked the main admin role from %1 user(s):\n%2",
      notAdmin: "⚠ | %1 user(s) are not main admins:\n%2",
      missingIdRemove: "⚠ | Provide a valid ID or tag to revoke the main admin role.",
      listAdmin: `👑 |  Main Admin Directory | 👑  
╭⎯⎯⎯⎯⎯⎯⎯⎯⎯ ╮   
%1  
╰⎯⎯⎯⎯⎯⎯⎯⎯⎯ ╯`,
      protectMessage: "🚫 | Removing the primary main admin is not allowed!",
      replyPromptAdd: "📩 | Reply to a message to add the user as a main admin.",
      replyPromptRemove: "📩 | Reply to a message to remove the user from main admin.",
      permissionError: "⚠ | This command can only be used by the main admin.",
      usageList: "🪄 | Main Admin Commands:\n" +
        "{pn} [add | -a] <uid | @tag>: Assign the main admin role\n" +
        "{pn} [remove | -r] <uid | @tag>: Revoke the main admin role\n" +
        "{pn} [list | -l]: View all main admins",
    },
  },

  onStart: async function ({ message, args, usersData, event, getLang, globalData }) {
    const senderId = event.senderID;
    const mainAdminId = config.main_admin;
    const configKey = "mainAdmins";

    if (senderId !== mainAdminId) {
      return message.reply(getLang("permissionError"));
    }


    function syncToConfig(mainAdminsConfig) {
      config.main_admins = mainAdminsConfig;
      const devPath = path.join(process.cwd(), "config.dev.json");
      const mainPath = path.join(process.cwd(), "config.json");
      
      try {
        const configPath = existsSync(devPath) ? devPath : existsSync(mainPath) ? mainPath : devPath;
        writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
      } catch (err) {
        console.error("❌ Failed to sync main_admins to config file:", err);
      }
    }


    let mainAdminsConfigData = await globalData.get(configKey);
    if (!mainAdminsConfigData) {
      await globalData.create(configKey, {
        data: config.main_admins || []
      });
      mainAdminsConfigData = await globalData.get(configKey);
    }

    const mainAdminsConfig = mainAdminsConfigData.data;
    const replyToUser = event.messageReply ? event.messageReply.senderID : null;

    if (args.length === 0) {
      return message.reply(getLang("usageList"));
    }


    syncToConfig(mainAdminsConfig);

    switch (args[0]) {
      case "add":
      case "-a": {
        if (args[1] || replyToUser) {
          let uids = [];
          if (replyToUser) {
            uids.push(replyToUser);
          } else if (Object.keys(event.mentions).length > 0) {
            uids = Object.keys(event.mentions);
          } else if (args[1]) {
            uids = args.filter((arg) => !isNaN(arg));
          }

          const notAdminIds = [];
          const adminIds = [];
          for (const uid of uids) {
            if (mainAdminsConfig.includes(uid)) {
              adminIds.push(uid);
            } else {
              notAdminIds.push(uid);
            }
          }

          mainAdminsConfig.push(...notAdminIds);
          await globalData.set(configKey, { data: mainAdminsConfig });
          syncToConfig(mainAdminsConfig);
          
          const getNames = await Promise.all(
            uids.map((uid) => usersData.getName(uid).then((name) => ({ uid, name })))
          );

          return message.reply(
            (notAdminIds.length > 0
              ? getLang(
                  "added",
                  notAdminIds.length,
                  getNames
                    .map(({ uid, name }) => `• ${name}\n╰${uid}`)
                    .join("\n")
                )
              : "") +
              (adminIds.length > 0
                ? getLang(
                    "alreadyAdmin",
                    adminIds.length,
                    adminIds.map((uid) => `• ${uid}`).join("\n")
                  )
                : "")
          );
        } else {
          return message.reply(getLang("missingIdAdd"));
        }
      }

      case "remove":
      case "-r": {
        if (args[1] || replyToUser) {
          let uids = [];
          if (replyToUser) {
            uids.push(replyToUser);
          } else if (Object.keys(event.mentions).length > 0) {
            uids = Object.keys(event.mentions);
          } else {
            uids = args.filter((arg) => !isNaN(arg));
          }

          const notAdminIds = [];
          const adminIds = [];
          for (const uid of uids) {
            if (uid === mainAdminId) {
              notAdminIds.push(uid);
            } else if (mainAdminsConfig.includes(uid)) {
              adminIds.push(uid);
            } else {
              notAdminIds.push(uid);
            }
          }

          if (notAdminIds.includes(mainAdminId)) {
            return message.reply(getLang("protectMessage"));
          }

          for (const uid of adminIds) {
            if (uid !== mainAdminId) {
              const index = mainAdminsConfig.indexOf(uid);
              if (index > -1) {
                mainAdminsConfig.splice(index, 1);
              }
            }
          }

          await globalData.set(configKey, { data: mainAdminsConfig });
          syncToConfig(mainAdminsConfig);

          const getNames = await Promise.all(
            adminIds.map((uid) => usersData.getName(uid).then((name) => ({ uid, name })))
          );

          return message.reply(
            (adminIds.length > 0
              ? getLang(
                  "removed",
                  adminIds.length,
                  getNames
                    .map(({ uid, name }) => `• ${name}\n╰${uid}`)
                    .join("\n")
                )
              : "") +
              (notAdminIds.length > 0
                ? getLang(
                    "notAdmin",
                    notAdminIds.length,
                    notAdminIds.map((uid) => `• ${uid}`).join("\n")
                  )
                : "")
          );
        } else {
          return message.reply(getLang("missingIdRemove"));
        }
      }

      case "list":
      case "-l": {
        const getNames = await Promise.all(
          mainAdminsConfig.map((uid) =>
            usersData.getName(uid).then((name) => ({ uid, name }))
          )
        );

        const admins = getNames.map(({ uid, name }) => `• ${name}\n╰${uid}`).join("\n");

        const listMessage = getLang("listAdmin", admins);
        return message.reply(listMessage);
      }

      default:
        return message.reply(getLang("usageList"));
    }
  },
};