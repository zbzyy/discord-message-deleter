const axios = require('axios');
const readlineSync = require('readline-sync');
const config = require('../config/config.json');

const delay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));

const fetchUserData = async (token) => {
    try {
        const res = await axios.get('https://discord.com/api/v9/users/@me', {
            headers: {
                Authorization: config.token
            }
        });
        return res.data;
    } catch (error) {
        console.error('Error fetching user data: ', error.response ? error.response.data : error.message);
        process.exit(1);
    }
};

const fetchAllSelfMessages = async (channelId, token, userId) => {
    let allMessages = [];
    let lastMessageId;

    console.log("Fetching messages...");

    try {
        while (true) {
            const url = `https://discord.com/api/v9/channels/${channelId}/messages?limit=100${lastMessageId ? `&before=${lastMessageId}` : ''}`;
            const res = await axios.get(url, {
                headers: {
                    Authorization: config.token
                }
            });

            const messages = res.data;
            if (messages.length === 0) {
                break;
            }

            const selfMessages = messages.filter(message => message.author.id === userId);
            allMessages = allMessages.concat(selfMessages);
            lastMessageId = messages[messages.length - 1].id;
        }

        return allMessages;
    } catch (error) {
        console.log(`Error fetching messages: `, error.response ? error.response.data : error.message);
        return allMessages;
    }
};

const deleteMessagesAPI = async (channelId, messageId, token) => {
    try {
        const res = await axios.delete(`https://discord.com/api/v9/channels/${channelId}/messages/${messageId}`, {
            headers: {
                Authorization: config.token
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
        } else {
            console.error(`Error deleting message: ${messageId}`, error.response ? error.response.data : error.message);
            return false;
        }
    }
};

const deleteAllSelfMessages = async (channelId, minDelay, maxDelay, token, userId) => {
    const allMessages = await fetchAllSelfMessages(channelId, token, userId);

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
            const success = await deleteMessagesAPI(channelId, message.id, token);
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

const main = async () => {
    const token = config.token;
    const userData = await fetchUserData(token);
    const userId = userData.id;

    console.log(`Logged in as ${userData.username}`);
    const channelId = readlineSync.question('Enter the channel ID to delete all self-messages from: ');

    const minDelay = parseInt(readlineSync.question('Enter minimum delay (ms): '), 10);
    const maxDelay = parseInt(readlineSync.question('Enter maximum delay (ms): '), 10);

    await deleteAllSelfMessages(channelId, minDelay, maxDelay, token, userId);
};

main();
