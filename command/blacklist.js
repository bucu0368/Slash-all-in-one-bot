
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const OWNER_ID = "1318639481003184128";

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('Manage server blacklist (Owner only)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Display all currently blacklisted servers with pagination')
                .addIntegerOption(option =>
                    option.setName('page')
                        .setDescription('Page number (default: 1)')
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a server from the blacklist')
                .addStringOption(option =>
                    option.setName('serverid')
                        .setDescription('Server ID to remove from blacklist')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('Blacklist a server from using bot commands')
                .addStringOption(option =>
                    option.setName('serverid')
                        .setDescription('Server ID to blacklist')
                        .setRequired(true)
                )
        ),

    // Store blacklisted servers in memory (in production, use a database)
    blacklistedServers: new Set(),

    async execute(interaction) {
        // Check if user is the bot owner
        if (interaction.user.id !== OWNER_ID) {
            await interaction.reply({ 
                content: 'This command can only be used by the bot owner.', 
                ephemeral: true 
            });
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'list':
                    await this.handleList(interaction);
                    break;
                case 'remove':
                    await this.handleRemove(interaction);
                    break;
                case 'server':
                    await this.handleBlacklist(interaction);
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

    async handleList(interaction) {
        const page = interaction.options.getInteger('page') || 1;
        const serversPerPage = 10;
        const blacklistedArray = Array.from(this.blacklistedServers);

        if (blacklistedArray.length === 0) {
            await interaction.reply('No servers are currently blacklisted.');
            return;
        }

        const totalPages = Math.ceil(blacklistedArray.length / serversPerPage);

        if (page > totalPages) {
            await interaction.reply(`Invalid page number. There are ${totalPages} page(s) of blacklisted servers.`);
            return;
        }

        const startIndex = (page - 1) * serversPerPage;
        const endIndex = startIndex + serversPerPage;
        const pageServers = blacklistedArray.slice(startIndex, endIndex);

        let description = '';
        for (let i = 0; i < pageServers.length; i++) {
            const serverId = pageServers[i];
            const serverNumber = startIndex + i + 1;
            
            try {
                const guild = await interaction.client.guilds.fetch(serverId);
                description += `${serverNumber}. **${guild.name}** (${serverId})\n`;
            } catch (error) {
                // Server not found or bot not in server
                description += `${serverNumber}. **Unknown Server** (${serverId})\n`;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('🚫 Blacklisted Servers')
            .setDescription(description)
            .setFooter({ text: `Page ${page} of ${totalPages} • ${blacklistedArray.length} total blacklisted servers` })
            .setColor(0xFF0000)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleRemove(interaction) {
        const serverId = interaction.options.getString('serverid');

        if (!this.blacklistedServers.has(serverId)) {
            await interaction.reply(`Server \`${serverId}\` is not currently blacklisted.`);
            return;
        }

        this.blacklistedServers.delete(serverId);

        let serverName = 'Unknown Server';
        try {
            const guild = await interaction.client.guilds.fetch(serverId);
            serverName = guild.name;
        } catch (error) {
            // Server not found or bot not in server
        }

        const embed = new EmbedBuilder()
            .setTitle('✅ Server Removed from Blacklist')
            .setDescription(`**${serverName}** (\`${serverId}\`) has been removed from the blacklist.\nMembers can now use bot commands again.`)
            .setColor(0x00FF00)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleBlacklist(interaction) {
        const serverId = interaction.options.getString('serverid');

        if (this.blacklistedServers.has(serverId)) {
            await interaction.reply(`Server \`${serverId}\` is already blacklisted.`);
            return;
        }

        this.blacklistedServers.add(serverId);

        let serverName = 'Unknown Server';
        try {
            const guild = await interaction.client.guilds.fetch(serverId);
            serverName = guild.name;
        } catch (error) {
            // Server not found or bot not in server
        }

        const embed = new EmbedBuilder()
            .setTitle('🚫 Server Blacklisted')
            .setDescription(`**${serverName}** (\`${serverId}\`) has been added to the blacklist.\nMembers can no longer use bot commands.`)
            .setColor(0xFF0000)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    // Method to check if a server is blacklisted
    isBlacklisted(serverId) {
        return this.blacklistedServers.has(serverId);
    }
};
