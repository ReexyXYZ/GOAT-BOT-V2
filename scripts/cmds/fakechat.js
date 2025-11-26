module.exports = {
    config: {
        name: "fakechat",
        aliases: ["fchat", "fakec"],
        version: "1.8",
        isPremium: true,
        role: 0,
        author: "Dipto | RUBISH",
        Description: "Get a fake chat of user",
        category: "Premium",
        countDown: 10,
        guide: {
            en: "{pn} [@tag | uid ] - <text> (or reply to a message with {pn} - <text>)",
        },
    },

    onStart: async ({
        event,
        message,
        usersData,
        args
    }) => {
        const PROTECTED_UIDS = ["100007806468843"];
        const BOT_UIDS = ["61569034245685"];
        const BOT_OWNERS = global.GoatBot.config.adminBot || [];

        try {
            const rawText = args.join(" ");

            if (!rawText && event.type !== "message_reply") {
                return message.reply(
                    `❌ | Please use with correct syntax:

.fchat <text> (reply a message)
.fchat @user - <text>
.fchat <UID> - <text>`
                );
            }

            let uid = null;
            let userText = "";

            let [targetPart, ...textParts] = rawText.split(/-(.+)/).map(s => s && s.trim());
            if (!textParts || textParts.length === 0) {
                if (event.type === "message_reply") {
                    uid = event.messageReply.senderID;
                    userText = rawText.trim();
                } else {
                    return message.reply(
                        "❌ Syntax error. You must use '-' to separate user and text.\nExample:\n.fchat @user - hello\n.fchat 123456789 - hi\nReply + .fchat - hi"
                    );
                }
            } else {
                userText = textParts[0];
            }

            if (!userText) {
                return message.reply("❌ Please provide the text after the '-' separator.");
            }

            if (!uid) {
                if (event.type === "message_reply" && (!targetPart || targetPart === "")) {
                    uid = event.messageReply.senderID;
                } else if (targetPart) {
                    if (event.mentions && Object.keys(event.mentions).length > 0) {
                        const mentionUIDs = Object.keys(event.mentions);
                        const mentionNames = mentionUIDs.map(id => usersData.getName(id));

                        let matchedUID = null;
                        for (let i = 0; i < mentionUIDs.length; i++) {
                            const name = (await mentionNames[i]) || "";
                            if (
                                targetPart.replace(/^@/, "").toLowerCase() === name.toLowerCase()
                            ) {
                                matchedUID = mentionUIDs[i];
                                break;
                            }
                        }
                        if (matchedUID) uid = matchedUID;
                        else uid = mentionUIDs[0];
                    } else if (/^\d+$/.test(targetPart)) {
                        uid = targetPart;
                    } else {
                        uid = event.senderID;
                    }
                } else {
                    uid = event.senderID;
                }
            }

            const isOwner = BOT_OWNERS.includes(event.senderID);

            if (!isOwner && PROTECTED_UIDS.includes(uid)) {
                return message.reply("😡 | Koto boro sahos tor?? Boss er fakechat make korte chas?");
            }

            if (!isOwner && BOT_UIDS.includes(uid)) {
                return message.reply("🤖 | Fake chat for bot is not allowed!");
            }

            const userName = (await usersData.getName(uid)) || "Unknown User";
            const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

            let apiUrl = `https://www.noobs-api.rf.gd/dipto/fbfakechat?name=${encodeURIComponent(
        userName
      )}&dp=${encodeURIComponent(avatarUrl)}&text=${encodeURIComponent(
        userText
      )}&key=dipto008`;

            const chatImgUrl = event?.messageReply?.attachments?.[0]?.url;
            if (chatImgUrl) apiUrl += `&chatimg=${encodeURIComponent(chatImgUrl)}`;

            await message.reply({
                body: ``,
                attachment: await global.utils.getStreamFromURL(apiUrl),
            });
        } catch (e) {
            await message.reply("❌ Error occurred while generating fake chat.");
            console.error("fakechat error:", e);
        }
    },
};