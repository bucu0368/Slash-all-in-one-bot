
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Server management commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Display detailed server information')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('emojis')
                .setDescription('Display all custom server emojis with pagination')
                .addIntegerOption(option =>
                    option.setName('page')
                        .setDescription('Page number (default: 1)')
                        .setMinValue(1)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('banlist')
                .setDescription('View server ban list (requires Ban Members permission)')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('membercount')
                .setDescription('Show breakdown of members (humans vs bots)')
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'info':
                    await this.handleServerInfo(interaction);
                    break;
                case 'emojis':
                    await this.handleServerEmojis(interaction);
                    break;
                case 'banlist':
                    await this.handleBanList(interaction);
                    break;
                case 'membercount':
                    await this.handleMemberCount(interaction);
                    break;
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
        }
    },

    async handleServerInfo(interaction) {
        const guild = interaction.guild;
        
        // Fetch additional guild data
        const owner = await guild.fetchOwner();
        const memberCount = guild.memberCount;
        const boostLevel = guild.premiumTier;
        const boostCount = guild.premiumSubscriptionCount;
        
        const embed = new EmbedBuilder()
            .setTitle(`${guild.name} Server Information`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: 'Server Name', value: guild.name, inline: true },
                { name: 'Server ID', value: guild.id, inline: true },
                { name: 'Owner', value: `${owner.user.tag}`, inline: true },
                { name: 'Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                { name: 'Member Count', value: memberCount.toString(), inline: true },
                { name: 'Boost Level', value: `Level ${boostLevel}`, inline: true },
                { name: 'Boost Count', value: boostCount.toString(), inline: true },
                { name: 'Verification Level', value: guild.verificationLevel.toString(), inline: true },
                { name: 'Text Channels', value: guild.channels.cache.filter(c => c.type === 0).size.toString(), inline: true },
                { name: 'Voice Channels', value: guild.channels.cache.filter(c => c.type === 2).size.toString(), inline: true },
                { name: 'Roles', value: guild.roles.cache.size.toString(), inline: true },
                { name: 'Emojis', value: guild.emojis.cache.size.toString(), inline: true }
            )
            .setColor(0x00AE86)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleServerEmojis(interaction) {
        const guild = interaction.guild;
        const emojis = guild.emojis.cache;
        const page = interaction.options.getInteger('page') || 1;
        const emojisPerPage = 20;
        
        if (emojis.size === 0) {
            await interaction.reply('This server has no custom emojis.');
            return;
        }
        
        const totalPages = Math.ceil(emojis.size / emojisPerPage);
        
        if (page > totalPages) {
            await interaction.reply(`Invalid page number. This server has ${totalPages} page(s) of emojis.`);
            return;
        }
        
        const startIndex = (page - 1) * emojisPerPage;
        const endIndex = startIndex + emojisPerPage;
        const pageEmojis = Array.from(emojis.values()).slice(startIndex, endIndex);
        
        const embed = new EmbedBuilder()
            .setTitle(`${guild.name} Custom Emojis`)
            .setDescription(pageEmojis.map(emoji => `${emoji} \`:${emoji.name}:\``).join('\n'))
            .setFooter({ text: `Page ${page} of ${totalPages} • ${emojis.size} total emojis` })
            .setColor(0x00AE86);

        // Create navigation buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`emojis_first_${guild.id}`)
                    .setLabel('⏮️ First')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 1),
                new ButtonBuilder()
                    .setCustomId(`emojis_prev_${guild.id}_${page}`)
                    .setLabel('⬅️ Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 1),
                new ButtonBuilder()
                    .setCustomId(`emojis_next_${guild.id}_${page}`)
                    .setLabel('Next ➡️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === totalPages),
                new ButtonBuilder()
                    .setCustomId(`emojis_last_${guild.id}_${totalPages}`)
                    .setLabel('Last ⏭️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === totalPages)
            );
        
        await interaction.reply({ embeds: [embed], components: [row] });
    },

    async handleBanList(interaction) {
        // Check if user has Ban Members permission
        if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            await interaction.reply({ content: 'You need the "Ban Members" permission to use this command.', ephemeral: true });
            return;
        }
        
        const guild = interaction.guild;
        
        try {
            const bans = await guild.bans.fetch();
            
            if (bans.size === 0) {
                await interaction.reply('This server has no banned users.');
                return;
            }
            
            const banList = Array.from(bans.values()).slice(0, 25); // Limit to first 25 bans
            
            const embed = new EmbedBuilder()
                .setTitle(`${guild.name} Ban List`)
                .setDescription(banList.map(ban => {
                    const reason = ban.reason || 'No reason provided';
                    return `**${ban.user.tag}** (${ban.user.id})\nReason: ${reason}`;
                }).join('\n\n'))
                .setFooter({ text: `Showing ${Math.min(25, bans.size)} of ${bans.size} banned users` })
                .setColor(0xFF0000);
            
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ content: 'Failed to fetch ban list. Make sure the bot has the necessary permissions.', ephemeral: true });
        }
    },

    async handleMemberCount(interaction) {
        const guild = interaction.guild;
        
        // Fetch all members to get accurate counts
        await guild.members.fetch();
        
        const totalMembers = guild.memberCount;
        const humans = guild.members.cache.filter(member => !member.user.bot).size;
        const bots = guild.members.cache.filter(member => member.user.bot).size;
        const onlineMembers = guild.members.cache.filter(member => member.presence?.status === 'online').size;
        
        const embed = new EmbedBuilder()
            .setTitle(`${guild.name} Member Statistics`)
            .addFields(
                { name: 'Total Members', value: totalMembers.toString(), inline: true },
                { name: 'Humans', value: humans.toString(), inline: true },
                { name: 'Bots', value: bots.toString(), inline: true },
                { name: 'Online', value: onlineMembers.toString(), inline: true },
                { name: 'Human Percentage', value: `${((humans / totalMembers) * 100).toFixed(1)}%`, inline: true },
                { name: 'Bot Percentage', value: `${((bots / totalMembers) * 100).toFixed(1)}%`, inline: true }
            )
            .setColor(0x00AE86)
            .setTimestamp();
        
        await interaction.reply({ embeds: [embed] });
    },

    async handleEmojiButtons(interaction) {
        const guild = interaction.guild;
        const emojis = guild.emojis.cache;
        const emojisPerPage = 20;
        const totalPages = Math.ceil(emojis.size / emojisPerPage);
        
        let page = 1;
        const [action, type, guildId, currentPage] = interaction.customId.split('_');
        
        switch (type) {
            case 'first':
                page = 1;
                break;
            case 'prev':
                page = Math.max(1, parseInt(currentPage) - 1);
                break;
            case 'next':
                page = Math.min(totalPages, parseInt(currentPage) + 1);
                break;
            case 'last':
                page = totalPages;
                break;
        }
        
        const startIndex = (page - 1) * emojisPerPage;
        const endIndex = startIndex + emojisPerPage;
        const pageEmojis = Array.from(emojis.values()).slice(startIndex, endIndex);
        
        const embed = new EmbedBuilder()
            .setTitle(`${guild.name} Custom Emojis`)
            .setDescription(pageEmojis.map(emoji => `${emoji} \`:${emoji.name}:\``).join('\n'))
            .setFooter({ text: `Page ${page} of ${totalPages} • ${emojis.size} total emojis` })
            .setColor(0x00AE86);

        // Create updated navigation buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`emojis_first_${guild.id}`)
                    .setLabel('⏮️ First')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 1),
                new ButtonBuilder()
                    .setCustomId(`emojis_prev_${guild.id}_${page}`)
                    .setLabel('⬅️ Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 1),
                new ButtonBuilder()
                    .setCustomId(`emojis_next_${guild.id}_${page}`)
                    .setLabel('Next ➡️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === totalPages),
                new ButtonBuilder()
                    .setCustomId(`emojis_last_${guild.id}_${totalPages}`)
                    .setLabel('Last ⏭️')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === totalPages)
            );
        
        await interaction.update({ embeds: [embed], components: [row] });
    }
};
