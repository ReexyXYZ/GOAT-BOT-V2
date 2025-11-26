const { getStreamsFromAttachment, log } = global.utils;
const mediaTypes = ["photo", 'png', "animated_image", "video", "audio"];
const customGroupID = "9191391594224159";

module.exports = {
    config: {
        name: "callad",
        version: "1.7",
        author: "NTKhang",
        countDown: 5,
        role: 0,
        description: "Send report, feedback, bug, etc., to a custom group and bot admins",
        category: "contacts admin",
        guide: "{pn} <message>"
    },

    onStart: async function ({ args, message, event, usersData, threadsData, api }) {
        const { config } = global.GoatBot;

        if (!args[0]) 
            return message.reply("⚠️ Please enter the message you want to send to the admins.");

        const { senderID, threadID, isGroup } = event;
        const senderName = await usersData.getName(senderID);
        const threadName = isGroup ? (await threadsData.get(threadID)).threadName : null;

        const msg = "==📨️ CALL ADMIN/GROUP 📨️=="
            + `\n- User Name: ${senderName}`
            + `\n- User ID: ${senderID}`
            + (isGroup ? `\n- Sent from group: ${threadName}\n- Thread ID: ${threadID}` : "\n- Sent from user")
            + `\n\nContent:\n─────────────────\n${args.join(" ")}\n─────────────────\nReply to this message to respond to the user.`;

        const formMessage = {
            body: msg,
            mentions: [{
                id: senderID,
                tag: senderName
            }],
            attachment: await getStreamsFromAttachment(
                [...event.attachments, ...(event.messageReply?.attachments || [])]
                    .filter(item => mediaTypes.includes(item.type))
            )
        };

        const successIDs = [];
        const failedIDs = [];
        const adminNames = await Promise.all(config.adminBot.map(async item => ({
            id: item,
            name: await usersData.getName(item)
        })));

        // Send to custom group
        try {
            await api.sendMessage(formMessage, customGroupID);
            successIDs.push("Custom Group");
        } catch (err) {
            failedIDs.push({ id: customGroupID, name: "Custom Group", error: err });
        }

        // Send to bot admins
        for (const uid of config.adminBot) {
            try {
                const messageSend = await api.sendMessage(formMessage, uid);
                successIDs.push(uid);
                global.GoatBot.onReply.set(messageSend.messageID, {
                    commandName: this.config.name,
                    messageID: messageSend.messageID,
                    threadID,
                    messageIDSender: event.messageID,
                    type: "userCallAdmin"
                });
            } catch (err) {
                failedIDs.push({ id: uid, name: adminNames.find(item => item.id === uid)?.name || uid, error: err });
            }
        }

        let resultMsg = "";
        if (successIDs.length > 0)
            resultMsg += `✅ Successfully sent your message Admin`;
        if (failedIDs.length > 0) {
            resultMsg += `\n❌ Failed to send your message`;
            log.err("CALL ADMIN/GROUP", failedIDs);
        }

        return message.reply(resultMsg);
    },

    onReply: async ({ args, event, api, message, Reply, usersData }) => {
        const { type, threadID, messageIDSender } = Reply;
        const senderName = await usersData.getName(event.senderID);

        if (type === "userCallAdmin") {
            const formMessage = {
                body: `📍 Reply from admin:\n─────────────────\n${args.join(" ")}\n─────────────────\nReply to this message to continue the conversation.`,
                mentions: [{
                    id: event.senderID,
                    tag: senderName
                }],
                attachment: await getStreamsFromAttachment(
                    event.attachments.filter(item => mediaTypes.includes(item.type))
                )
            };

            // Send the reply back to the user in the original thread
            try {
                await api.sendMessage(formMessage, threadID);
                message.reply("✅ Your reply has been sent to the user successfully!");
            } catch (err) {
                message.reply(`❌ Failed to send your reply: ${err}`);
            }
        }
    }
};
``
