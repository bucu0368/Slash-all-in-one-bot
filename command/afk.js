
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('AFK status management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set your AFK status')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for being AFK (optional)')
                        .setRequired(false)
                        .setMaxLength(200)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all AFK users in the server')
        ),

    // Store AFK users in memory (in production, use a database)
    afkUsers: new Map(),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'set':
                    await this.handleSetAFK(interaction);
                    break;
                case 'list':
                    await this.handleListAFK(interaction);
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

    async handleSetAFK(interaction) {
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;
        const afkKey = `${guildId}_${userId}`;

        // Check if user is already AFK
        if (this.afkUsers.has(afkKey)) {
            // Remove AFK status
            this.afkUsers.delete(afkKey);

            const embed = new EmbedBuilder()
                .setTitle('AFK Status Removed')
                .setDescription('Welcome back! Your AFK status has been removed.')
                .setColor(0x00FF00)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } else {
            // Set AFK status
            this.afkUsers.set(afkKey, {
                userId: userId,
                username: interaction.user.username,
                displayName: interaction.member.displayName,
                reason: reason,
                timestamp: Date.now()
            });

            const embed = new EmbedBuilder()
                .setTitle('AFK Status Set')
                .setDescription(`You are now AFK: **${reason}**`)
                .setColor(0xFFFF00)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    },

    async handleListAFK(interaction) {
        const guildId = interaction.guild.id;
        const guildAFKUsers = [];

        // Filter AFK users for this guild
        for (const [key, afkData] of this.afkUsers.entries()) {
            if (key.startsWith(`${guildId}_`)) {
                guildAFKUsers.push(afkData);
            }
        }

        if (guildAFKUsers.length === 0) {
            await interaction.reply({ 
                content: 'No users are currently AFK in this server.', 
                ephemeral: true 
            });
            return;
        }

        // Sort by timestamp (oldest first)
        guildAFKUsers.sort((a, b) => a.timestamp - b.timestamp);

        const afkList = guildAFKUsers.map(afkData => {
            const timeAgo = Math.floor((Date.now() - afkData.timestamp) / 1000);
            const timeString = this.formatTimeAgo(timeAgo);
            return `• **${afkData.displayName}** - ${afkData.reason}\n  *AFK since ${timeString} ago*`;
        }).join('\n\n');

        const embed = new EmbedBuilder()
            .setTitle(`AFK Users in ${interaction.guild.name}`)
            .setDescription(afkList)
            .setColor(0xFFFF00)
            .setFooter({ text: `${guildAFKUsers.length} user(s) currently AFK` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    formatTimeAgo(seconds) {
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval > 1 ? 's' : ''}`;
            }
        }

        return 'a few seconds';
    }
};
