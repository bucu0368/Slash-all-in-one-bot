
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bot')
        .setDescription('Bot information and utility commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('ping')
                .setDescription('Check bot latency and API response time')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('uptime')
                .setDescription('Display bot uptime')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Display bot statistics')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('invite')
                .setDescription('Get bot invite link')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('serverlist')
                .setDescription('List all servers the bot is in (Owner only)')
                .addIntegerOption(option =>
                    option.setName('page')
                        .setDescription('Page number (default: 1)')
                        .setMinValue(1)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'ping':
                    await this.handlePing(interaction);
                    break;
                case 'uptime':
                    await this.handleUptime(interaction);
                    break;
                case 'stats':
                    await this.handleStats(interaction);
                    break;
                case 'invite':
                    await this.handleInvite(interaction);
                    break;
                case 'serverlist':
                    await this.handleServerList(interaction);
                    break;
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'An error occurred while processing your request.', 
                ephemeral: true 
            });
        }
    },

    async handlePing(interaction) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        const timeDiff = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .addFields(
                { name: 'Bot Latency', value: `${timeDiff}ms`, inline: true },
                { name: 'API Latency', value: `${apiLatency}ms`, inline: true }
            )
            .setColor(0x00AE86)
            .setTimestamp();

        await interaction.editReply({ content: '', embeds: [embed] });
    },

    async handleUptime(interaction) {
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);

        let uptimeString = '';
        if (days > 0) uptimeString += `${days}d `;
        if (hours > 0) uptimeString += `${hours}h `;
        if (minutes > 0) uptimeString += `${minutes}m `;
        uptimeString += `${seconds}s`;

        const embed = new EmbedBuilder()
            .setTitle('⏰ Bot Uptime')
            .setDescription(`Bot has been running for: **${uptimeString}**`)
            .setColor(0x00AE86)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleStats(interaction) {
        const client = interaction.client;
        
        // Calculate memory usage
        const memoryUsage = process.memoryUsage();
        const memoryUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
        const memoryTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);

        // Get uptime
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        
        let uptimeString = '';
        if (days > 0) uptimeString += `${days}d `;
        if (hours > 0) uptimeString += `${hours}h `;
        if (minutes > 0) uptimeString += `${minutes}m`;

        const embed = new EmbedBuilder()
            .setTitle('📊 Bot Statistics')
            .addFields(
                { name: 'Servers', value: client.guilds.cache.size.toString(), inline: true },
                { name: 'Users', value: client.users.cache.size.toString(), inline: true },
                { name: 'Channels', value: client.channels.cache.size.toString(), inline: true },
                { name: 'Commands', value: client.commands.size.toString(), inline: true },
                { name: 'Ping', value: `${client.ws.ping}ms`, inline: true },
                { name: 'Node.js', value: process.version, inline: true },
                { name: 'Memory Usage', value: `${memoryUsed}MB / ${memoryTotal}MB`, inline: true },
                { name: 'Uptime', value: uptimeString || 'Less than 1 minute', inline: true },
                { name: 'Discord.js', value: require('discord.js').version, inline: true }
            )
            .setColor(0x00AE86)
            .setTimestamp()
            .setFooter({ text: `Bot ID: ${client.user.id}` });

        await interaction.reply({ embeds: [embed] });
    },

    async handleInvite(interaction) {
        const client = interaction.client;
        
        // Create invite link with necessary permissions
        const permissions = [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.UseSlashCommands,
            PermissionFlagsBits.ManageRoles,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.BanMembers,
            PermissionFlagsBits.ManageEmojisAndStickers,
            PermissionFlagsBits.ViewChannel
        ];

        const permissionsBigInt = permissions.reduce((acc, perm) => acc | perm, 0n);
        const inviteLink = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=${permissionsBigInt}&scope=bot%20applications.commands`;

        const embed = new EmbedBuilder()
            .setTitle('🔗 Invite Bot')
            .setDescription(`Click the link below to invite me to your server!`)
            .addFields(
                { name: 'Invite Link', value: `[Click here to invite](${inviteLink})`, inline: false },
                { name: 'Permissions', value: 'The bot will request the necessary permissions to function properly.', inline: false }
            )
            .setColor(0x00AE86)
            .setTimestamp()
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }));

        await interaction.reply({ embeds: [embed] });
    },

    async handleServerList(interaction) {
        const OWNER_ID = "1318639481003184128";
        
        // Check if user is owner
        if (interaction.user.id !== OWNER_ID) {
            await interaction.reply({ 
                content: 'This command is restricted to the bot owner only.', 
                ephemeral: true 
            });
            return;
        }

        const client = interaction.client;
        const guilds = Array.from(client.guilds.cache.values());
        const page = interaction.options.getInteger('page') || 1;
        const serversPerPage = 10;
        const totalPages = Math.ceil(guilds.length / serversPerPage);

        if (page > totalPages) {
            await interaction.reply({ 
                content: `Invalid page number. There are ${totalPages} page(s) of servers.`, 
                ephemeral: true 
            });
            return;
        }

        const startIndex = (page - 1) * serversPerPage;
        const endIndex = startIndex + serversPerPage;
        const pageServers = guilds.slice(startIndex, endIndex);

        let description = '';
        for (let i = 0; i < pageServers.length; i++) {
            const guild = pageServers[i];
            const serverNumber = startIndex + i + 1;
            description += `${serverNumber}. **${guild.name}**\n`;
            description += `   Members: ${guild.memberCount}\n`;
            description += `   Server ID: ${guild.id}\n\n`;
        }

        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot Server List')
            .setDescription(description)
            .setFooter({ text: `Page ${page} of ${totalPages} • ${guilds.length} total servers` })
            .setColor(0x00AE86)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
