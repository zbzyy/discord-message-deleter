const axios = require('axios');
const readlineSync = require('readline-sync');
const { Client } = require('discord.js-selfbot-v13');
const chalk = require('chalk');

const bot = new Client({ checkUpdate: false });
const config = require('../config/config.json');

const delay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));

const fetchAllSelfMessages = async (channelId) => {
    let allMessages = [];
    let lastMessageId;

    console.log(chalk.grey("Fetching messages..."));

    try {
        while (true) {
            const url = `https://discord.com/api/v9/channels/${channelId}/messages?limit=100${lastMessageId ? `&before=${lastMessageId}` : ''}`;
            const res = await axios.get(url, {
                headers: {
                    Authorization: bot.token
                }
            });

            const messages = res.data;
            if (messages.length === 0) {
                break;
            }

            const selfMessages = messages.filter(message => message.author.id === bot.user.id);
            allMessages = allMessages.concat(selfMessages);
            lastMessageId = messages[messages.length - 1].id;
        }

        return allMessages;
    } catch (error) {
        console.log(`Error fetching messages: `, error);
        return allMessages;
    }
};

const deleteMessagesAPI = async (channelId, messageId) => {
    try {
        const res = await axios.delete(`https://discord.com/api/v9/channels/${channelId}/messages/${messageId}`, {
            headers: {
                Authorization: bot.token
            }
        });

        if (res.status === 204) {
            return true;
        } else {
            console.log(`Unexpected response status ${res.status} for message ${messageId}`);
            return false; 
        }
    } catch (error) {
        if (error.response && error.response.data && error.response.data.code === 50021) {
            console.log(`Skipped system message: ${messageId}`);
            return false;
        }
    }
};

const deleteAllSelfMessages = async (channelId, minDelay, maxDelay) => {
    const allMessages = await fetchAllSelfMessages(channelId);

    if (allMessages.length > 0) {
        const estimatedTime = calculateEstimatedTime(allMessages.length, minDelay, maxDelay);

        const confirmed = readlineSync.keyInYN(`${estimatedTime} Confirm deletion?`);
        if (!confirmed) {
            console.log('Operation cancelled.');
            process.exit();
        }

        for (let i = 0; i < allMessages.length; i++) {
            const message = allMessages[i];
            await delay(minDelay, maxDelay);
            const success = await deleteMessagesAPI(channelId, message.id);
            if (success) {
                console.log(`Deleted message: ${message.id} [${i + 1}]`);
            }
        }
        console.log('All self-messages processed.');
    } else {
        console.log('No self-messages found to delete.');
    }
};

const calculateEstimatedTime = (messageCount, minDelay, maxDelay) => {
    const averageDelay = (minDelay + maxDelay) / 2;
    const totalTimeSeconds = messageCount * (averageDelay / 1000);
    const totalTimeMinutes = Math.floor(totalTimeSeconds / 60);
    const remainingSeconds = Math.floor(totalTimeSeconds % 60);
    const totalTimeHours = Math.floor(totalTimeMinutes / 60);
    const remainingMinutes = totalTimeMinutes % 60;

    return `Estimated time to delete ${messageCount} messages: ${totalTimeHours} hours, ${remainingMinutes} minutes, and ${remainingSeconds} seconds.`;
};

bot.on('ready', async () => {
    console.log(`Logged in as ${bot.user.tag}`);
    const channelId = readlineSync.question('Enter the channel ID to delete all self-messages from: ');

    const minDelay = parseInt(readlineSync.question('Enter minimum delay (ms): '), 10);
    const maxDelay = parseInt(readlineSync.question('Enter maximum delay (ms): '), 10);

    await deleteAllSelfMessages(channelId, minDelay, maxDelay);
});

bot.login(config.token);