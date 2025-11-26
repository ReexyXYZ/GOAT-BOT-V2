 module.exports = {
    config: {
        name: "onlyadminbox",
        aliases: ["onlyadbox", "adboxonly", "adminboxonly"],
        version: "1.5",
        author: "NTKhang",
        countDown: 5,
        role: 1,
        description: {
            en: "Turn on/off only admin box can use bot"
        },
        category: "box chat",
        guide: {
            en: "   {pn} [on | off] [threadID]: Turn on/off the mode only group admin can use the bot for a specific thread"
                + "\n   {pn} noti [on | off]: Turn on/off notification when non-admin users try to use the bot"
                + "\n   {pn} list: Show all threads with the 'only admin box' mode turned on"
        }
    },

    langs: {
        en: {
            turnedOn: "Turned on the mode: only group admins can use the bot in thread {threadID}",
            turnedOff: "Turned off the mode: all users can use the bot in thread {threadID}",
            turnedOnNoti: "Turned on notifications for non-admin bot usage attempts in thread {threadID}",
            turnedOffNoti: "Turned off notifications for non-admin bot usage attempts in thread {threadID}",
            syntaxError: "Syntax error, use {pn} [on | off] [threadID]",
            noPermission: "You don't have permission to use the bot. Only group admins or bot admins can use it in this mode.",
            noThreads: "No threads with the 'only admin box' mode are currently activated.",
            threadsList: "Threads with 'only admin box' mode turned on:\n{threads}"
        }
    },

    onStart: async function ({ args, message, event, threadsData, getLang, api }) {
        const { config } = global.GoatBot;
        const botAdmins = [config.main_admin, ...config.main_admins];

        // Ensure bot admins have permission for thread-specific operations
        if (args.length > 1 && !botAdmins.includes(event.senderID)) {
            return message.reply(getLang("noPermission"));
        }

        let isSetNoti = false;
        let value;
        let keySetData = "data.onlyAdminBox";
        let indexGetVal = 0;

        // Determine if notification settings are being modified
        if (args[0] === "noti") {
            isSetNoti = true;
            indexGetVal = 1;
            keySetData = "data.hideNotiMessageOnlyAdminBox";
        }

        // Parse on/off value
        if (args[indexGetVal] === "on") {
            value = true;
        } else if (args[indexGetVal] === "off") {
            value = false;
        } else if (args[0] === "list") {
            // Show all threads with the "only admin box" mode turned on
            const allThreads = await threadsData.getAll();
            const activeThreads = [];

            for (let threadID in allThreads) {
                const threadData = allThreads[threadID];
                if (threadData.data.onlyAdminBox) {
                    // Fetch the real thread name using the API
                    const threadName = await getThreadName(threadID, api);
                    // Stylized output with the thread name on top and ID below
                    activeThreads.push(`*${threadName}*\nID: ${threadID}`);
                }
            }
            
            if (activeThreads.length === 0) {
                return message.reply(getLang("noThreads"));
            }

            return message.reply(getLang("threadsList").replace("{threads}", activeThreads.join("\n\n")));
        } else {
            return message.reply(getLang("syntaxError"));
        }

        // Determine target threadID
        const threadID = args.length > (isSetNoti ? 2 : 1) ? args[args.length - 1] : event.threadID;

        // Update thread data
        await threadsData.set(threadID, isSetNoti ? !value : value, keySetData);

        // Generate reply message
        const replyMessage = isSetNoti
            ? (value ? getLang("turnedOnNoti") : getLang("turnedOffNoti")).replace("{threadID}", threadID)
            : (value ? getLang("turnedOn") : getLang("turnedOff")).replace("{threadID}", threadID);

        return message.reply(replyMessage);
    },

    onChat: async function ({ message, event, threadsData, getLang }) {
        const { config } = global.GoatBot;
        const botAdmins = [config.main_admin, ...config.main_admins, ...config.adminBot];
        const onlyAdminBox = await threadsData.get(event.threadID, "data.onlyAdminBox", false);
        
        if (!onlyAdminBox) {
            return;
        }

        const threadData = await threadsData.get(event.threadID);
        const threadAdmins = threadData.adminIDs || [];

        if (botAdmins.includes(event.senderID)) {
            return;
        }

        if (!threadAdmins.includes(event.senderID)) {
            const hideNoti = await threadsData.get(event.threadID, "data.hideNotiMessageOnlyAdminBox", false);
            if (!hideNoti) {
                return message.reply(getLang("noPermission"));
            }
            return "stop";
        }
    }
};

// Helper function to get the real thread name using getThreadInfo from the API
async function getThreadName(threadID, api) {
    try {
        const threadInfo = await api.getThreadInfo(threadID);
        // Return the thread name, or fallback to just using the thread ID if not available
        return threadInfo.name || `Thread ID: ${threadID}`;
    } catch (error) {
        console.error("Error fetching thread name:", error);
        // If the name can't be fetched, return the thread ID as fallback
        return `Thread ID: ${threadID}`;
    }
                }
