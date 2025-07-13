const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = "bot token";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Load commands
client.commands = new Map();
const commandsPath = path.join(__dirname, 'command');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Register slash commands
    const commands = Array.from(client.commands.values()).map(command => command.data);

    try {
        console.log('Started refreshing application (/) commands.');
        await client.application.commands.set(commands);
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        // Check if server is blacklisted (except for blacklist command itself)
        if (interaction.commandName !== 'blacklist') {
            const blacklistCommand = client.commands.get('blacklist');
            if (blacklistCommand && blacklistCommand.isBlacklisted(interaction.guild.id)) {
                await interaction.reply({ 
                    content: 'This server has been blacklisted from using bot commands.', 
                    ephemeral: true 
                });
                return;
            }
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'There was an error while executing this command!', 
                ephemeral: true 
            });
        }
    } else if (interaction.isButton()) {
        // Handle emoji pagination buttons
        if (interaction.customId.startsWith('emojis_')) {
            const serverCommand = client.commands.get('server');
            if (serverCommand) {
                await serverCommand.handleEmojiButtons(interaction);
            }
        }
    }
});

client.on('guildMemberAdd', async member => {
    try {
        const autoRoleCommand = client.commands.get('autorole');
        if (!autoRoleCommand) return;

        const autoRoles = autoRoleCommand.autoRoles.get(member.guild.id) || [];
        
        if (autoRoles.length === 0) return;

        for (const roleId of autoRoles) {
            const role = member.guild.roles.cache.get(roleId);
            if (role && role.position < member.guild.members.me.roles.highest.position) {
                try {
                    await member.roles.add(role);
                    console.log(`Added auto-role ${role.name} to ${member.user.tag}`);
                } catch (error) {
                    console.error(`Failed to add auto-role ${role.name} to ${member.user.tag}:`, error);
                }
            }
        }
    } catch (error) {
        console.error('Error in guildMemberAdd event:', error);
    }
});

client.on('messageCreate', async message => {
    try {
        const stickCommand = client.commands.get('stick');
        if (stickCommand) {
            await stickCommand.handleMessage(message);
        }
    } catch (error) {
        console.error('Error in messageCreate event:', error);
    }
});

client.login(token);