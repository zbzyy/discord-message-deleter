# Discord Message Deleter

This script allows you to delete all of your messages from a specific Discord DM channel or server. It fetches your messages, calculates the estimated time for deletion based on user-defined delays, and deletes them sequentially with randomized delays to avoid hitting rate limits.

## Prerequisites

- Node.js (version 12 or later)
- `discord.js-selfbot-v13`
- `axios`
- `readline-sync`
- `chalk@4.1.2`

## Installation

1. Clone the repository or download the script files.
2. Navigate to the project directory and install the required packages:

    ```bash
    npm install discord.js-selfbot-v13 axios readline-sync chalk@4.1.2
    ```

3. Input your Discord bot token in the `config/config.json` file:

    ```json
    {
      "token": "YOUR_DISCORD_BOT_TOKEN"
    }
    ```

## Usage

1. Ensure your Discord bot token is correctly set in `config.json`.
2. Run the script:

    ```bash
    node path/to/your/script.js
    ```

3. Follow the prompts:
    - Enter the channel or server ID.
    - Specify minimum and maximum delay times in milliseconds.
    - Confirm the deletion after reviewing the estimated time.

### Example

![Example Screenshot](https://github.com/user-attachments/assets/ce7997af-9f2e-4e56-81c5-6edb38c5d969)

## Notes

- Use this script responsibly to avoid potential bans from Discord.
- Randomized delays help mitigate the risk of rate limiting.
- The chosen delay will influence the speed of message deletion. This script prioritizes safety over speed.

## Known Issues

You may encounter the following error:

![image](https://github.com/user-attachments/assets/a6c933e7-3375-41a2-b56a-f864aa08dccf)

This error occurs when the bot attempts to delete a message related to a user starting a call. The script will continue functioning normally despite this issue. A future update will address this problem by checking for and handling such errors in a more effective way.
