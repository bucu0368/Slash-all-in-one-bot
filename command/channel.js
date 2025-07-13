
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channel')
        .setDescription('Channel management commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand(subcommand =>
            subcommand
                .setName('unhideall')
                .setDescription('Unhide all channels for @everyone role')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('hideall')
                .setDescription('Hide all channels from @everyone role')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlockall')
                .setDescription('Unlock all channels for @everyone role')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('lockall')
                .setDescription('Lock all channels from @everyone role')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clone')
                .setDescription('Clone a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to clone')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Name for the cloned channel (optional)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to delete')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Display detailed information about a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to get information about (defaults to current channel)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('lock')
                .setDescription('Lock a specific channel from @everyone role')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to lock')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlock')
                .setDescription('Unlock a specific channel for @everyone role')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to unlock')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        // Check if bot has MANAGE_CHANNELS permission
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
            await interaction.reply({ 
                content: 'I need the "Manage Channels" permission to execute this command.', 
                ephemeral: true 
            });
            return;
        }

        // Check if user has MANAGE_CHANNELS permission
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            await interaction.reply({ 
                content: 'You need the "Manage Channels" permission to use this command.', 
                ephemeral: true 
            });
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'unhideall':
                    await this.handleUnhideAll(interaction);
                    break;
                case 'hideall':
                    await this.handleHideAll(interaction);
                    break;
                case 'unlockall':
                    await this.handleUnlockAll(interaction);
                    break;
                case 'lockall':
                    await this.handleLockAll(interaction);
                    break;
                case 'clone':
                    await this.handleClone(interaction);
                    break;
                case 'delete':
                    await this.handleDelete(interaction);
                    break;
                case 'info':
                    await this.handleInfo(interaction);
                    break;
                case 'lock':
                    await this.handleLockChannel(interaction);
                    break;
                case 'unlock':
                    await this.handleUnlockChannel(interaction);
                    break;
            }
        } catch (error) {
            console.error(error);
            const errorMessage = error.message.includes('Missing Permissions') 
                ? 'I don\'t have permission to manage this channel. Make sure I have the necessary permissions.'
                : 'An error occurred while processing your request.';
            
            if (interaction.replied) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },

    async handleUnhideAll(interaction) {
        await interaction.deferReply();

        const guild = interaction.guild;
        const everyoneRole = guild.roles.everyone;
        const channels = guild.channels.cache.filter(channel => 
            channel.type === ChannelType.GuildText || 
            channel.type === ChannelType.GuildVoice || 
            channel.type === ChannelType.GuildCategory
        );

        let successCount = 0;
        let failCount = 0;

        for (const channel of channels.values()) {
            try {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    ViewChannel: null
                });
                successCount++;
            } catch (error) {
                failCount++;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('Channels Unhidden')
            .setDescription(`Successfully unhidden ${successCount} channels for @everyone.${failCount > 0 ? `\nFailed to unhide ${failCount} channels.` : ''}`)
            .setColor(0x00FF00)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },

    async handleHideAll(interaction) {
        await interaction.deferReply();

        const guild = interaction.guild;
        const everyoneRole = guild.roles.everyone;
        const channels = guild.channels.cache.filter(channel => 
            channel.type === ChannelType.GuildText || 
            channel.type === ChannelType.GuildVoice || 
            channel.type === ChannelType.GuildCategory
        );

        let successCount = 0;
        let failCount = 0;

        for (const channel of channels.values()) {
            try {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    ViewChannel: false
                });
                successCount++;
            } catch (error) {
                failCount++;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('Channels Hidden')
            .setDescription(`Successfully hidden ${successCount} channels from @everyone.${failCount > 0 ? `\nFailed to hide ${failCount} channels.` : ''}`)
            .setColor(0xFF0000)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },

    async handleUnlockAll(interaction) {
        await interaction.deferReply();

        const guild = interaction.guild;
        const everyoneRole = guild.roles.everyone;
        const channels = guild.channels.cache.filter(channel => 
            channel.type === ChannelType.GuildText || 
            channel.type === ChannelType.GuildVoice
        );

        let successCount = 0;
        let failCount = 0;

        for (const channel of channels.values()) {
            try {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: null,
                    Speak: null
                });
                successCount++;
            } catch (error) {
                failCount++;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('Channels Unlocked')
            .setDescription(`Successfully unlocked ${successCount} channels for @everyone.${failCount > 0 ? `\nFailed to unlock ${failCount} channels.` : ''}`)
            .setColor(0x00FF00)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },

    async handleLockAll(interaction) {
        await interaction.deferReply();

        const guild = interaction.guild;
        const everyoneRole = guild.roles.everyone;
        const channels = guild.channels.cache.filter(channel => 
            channel.type === ChannelType.GuildText || 
            channel.type === ChannelType.GuildVoice
        );

        let successCount = 0;
        let failCount = 0;

        for (const channel of channels.values()) {
            try {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: false,
                    Speak: false
                });
                successCount++;
            } catch (error) {
                failCount++;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('Channels Locked')
            .setDescription(`Successfully locked ${successCount} channels from @everyone.${failCount > 0 ? `\nFailed to lock ${failCount} channels.` : ''}`)
            .setColor(0xFF0000)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },

    async handleClone(interaction) {
        const channel = interaction.options.getChannel('channel');
        const name = interaction.options.getString('name') || `${channel.name}-clone`;

        await interaction.deferReply();

        try {
            const clonedChannel = await channel.clone({
                name: name,
                reason: `Cloned by ${interaction.user.tag}`
            });

            const embed = new EmbedBuilder()
                .setTitle('Channel Cloned')
                .setDescription(`Successfully cloned ${channel} to ${clonedChannel}`)
                .setColor(0x00AE86)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply({ 
                content: 'Failed to clone the channel. Make sure I have the necessary permissions.', 
                ephemeral: true 
            });
        }
    },

    async handleDelete(interaction) {
        const channel = interaction.options.getChannel('channel');

        if (channel.id === interaction.channel.id) {
            await interaction.reply({ 
                content: 'You cannot delete the channel you are currently in.', 
                ephemeral: true 
            });
            return;
        }

        const channelName = channel.name;
        const channelType = channel.type;

        try {
            await channel.delete(`Deleted by ${interaction.user.tag}`);

            const embed = new EmbedBuilder()
                .setTitle('Channel Deleted')
                .setDescription(`Successfully deleted **${channelName}** (${channelType === ChannelType.GuildText ? 'Text' : channelType === ChannelType.GuildVoice ? 'Voice' : 'Category'} Channel)`)
                .setColor(0xFF0000)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ 
                content: 'Failed to delete the channel. Make sure I have the necessary permissions.', 
                ephemeral: true 
            });
        }
    },

    async handleInfo(interaction) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        const getChannelType = (type) => {
            switch (type) {
                case ChannelType.GuildText: return 'Text Channel';
                case ChannelType.GuildVoice: return 'Voice Channel';
                case ChannelType.GuildCategory: return 'Category';
                case ChannelType.GuildAnnouncement: return 'Announcement Channel';
                case ChannelType.AnnouncementThread: return 'Announcement Thread';
                case ChannelType.PublicThread: return 'Public Thread';
                case ChannelType.PrivateThread: return 'Private Thread';
                case ChannelType.GuildStageVoice: return 'Stage Channel';
                case ChannelType.GuildForum: return 'Forum Channel';
                default: return 'Unknown';
            }
        };

        const embed = new EmbedBuilder()
            .setTitle(`Channel Information: #${channel.name}`)
            .addFields(
                { name: 'Channel Name', value: channel.name, inline: true },
                { name: 'Channel ID', value: channel.id, inline: true },
                { name: 'Type', value: getChannelType(channel.type), inline: true },
                { name: 'Created', value: `<t:${Math.floor(channel.createdTimestamp / 1000)}:F>`, inline: true },
                { name: 'Position', value: channel.position?.toString() || 'N/A', inline: true },
                { name: 'NSFW', value: channel.nsfw ? 'Yes' : 'No', inline: true }
            )
            .setColor(0x00AE86)
            .setTimestamp();

        // Add additional fields based on channel type
        if (channel.topic) {
            embed.addFields({ name: 'Topic', value: channel.topic });
        }

        if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) {
            embed.addFields(
                { name: 'Slowmode', value: channel.rateLimitPerUser ? `${channel.rateLimitPerUser} seconds` : 'Disabled', inline: true }
            );
        }

        if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
            embed.addFields(
                { name: 'User Limit', value: channel.userLimit ? channel.userLimit.toString() : 'Unlimited', inline: true },
                { name: 'Bitrate', value: `${channel.bitrate / 1000} kbps`, inline: true }
            );
        }

        if (channel.parent) {
            embed.addFields({ name: 'Category', value: channel.parent.name, inline: true });
        }

        // Add permission overwrites count
        const overwritesCount = channel.permissionOverwrites.cache.size;
        embed.addFields({ name: 'Permission Overwrites', value: overwritesCount.toString(), inline: true });

        await interaction.reply({ embeds: [embed] });
    },

    async handleLockChannel(interaction) {
        const channel = interaction.options.getChannel('channel');
        const everyoneRole = interaction.guild.roles.everyone;

        try {
            if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: false
                });
            } else if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    Speak: false
                });
            } else {
                await interaction.reply({ 
                    content: 'This channel type cannot be locked.', 
                    ephemeral: true 
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('Channel Locked')
                .setDescription(`Successfully locked ${channel} from @everyone.`)
                .setColor(0xFF0000)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ 
                content: 'Failed to lock the channel. Make sure I have the necessary permissions.', 
                ephemeral: true 
            });
        }
    },

    async handleUnlockChannel(interaction) {
        const channel = interaction.options.getChannel('channel');
        const everyoneRole = interaction.guild.roles.everyone;

        try {
            if (channel.type === ChannelType.GuildText || channel.type === ChannelType.GuildAnnouncement) {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    SendMessages: null
                });
            } else if (channel.type === ChannelType.GuildVoice || channel.type === ChannelType.GuildStageVoice) {
                await channel.permissionOverwrites.edit(everyoneRole, {
                    Speak: null
                });
            } else {
                await interaction.reply({ 
                    content: 'This channel type cannot be unlocked.', 
                    ephemeral: true 
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('Channel Unlocked')
                .setDescription(`Successfully unlocked ${channel} for @everyone.`)
                .setColor(0x00FF00)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ 
                content: 'Failed to unlock the channel. Make sure I have the necessary permissions.', 
                ephemeral: true 
            });
        }
    }
};
