
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emoji')
        .setDescription('Emoji management commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers)
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Display information about an emoji')
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('The emoji to get information about')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('steal')
                .setDescription('Steal an emoji from another server')
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('The emoji to steal')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Custom name for the emoji (optional)')
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete an emoji from this server')
                .addStringOption(option =>
                    option.setName('emoji')
                        .setDescription('The emoji to delete')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'info':
                    await this.handleEmojiInfo(interaction);
                    break;
                case 'steal':
                    await this.handleEmojiSteal(interaction);
                    break;
                case 'delete':
                    await this.handleEmojiDelete(interaction);
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

    async handleEmojiInfo(interaction) {
        const emojiInput = interaction.options.getString('emoji');
        
        // Parse emoji ID from input
        const emojiMatch = emojiInput.match(/<a?:(\w+):(\d+)>/);
        
        if (!emojiMatch) {
            await interaction.reply({ 
                content: 'Please provide a valid custom emoji (not a Unicode emoji).', 
                ephemeral: true 
            });
            return;
        }

        const [, emojiName, emojiId] = emojiMatch;
        
        try {
            // Try to find the emoji in the current guild first
            let emoji = interaction.guild.emojis.cache.get(emojiId);
            
            if (!emoji) {
                // If not found in current guild, try to fetch from Discord
                try {
                    emoji = await interaction.client.application.emojis.fetch(emojiId);
                } catch {
                    await interaction.reply({ 
                        content: 'Emoji not found or not accessible.', 
                        ephemeral: true 
                    });
                    return;
                }
            }

            const embed = new EmbedBuilder()
                .setTitle(`Emoji Information: ${emoji.name}`)
                .setThumbnail(emoji.url)
                .addFields(
                    { name: 'Name', value: emoji.name, inline: true },
                    { name: 'ID', value: emoji.id, inline: true },
                    { name: 'Animated', value: emoji.animated ? 'Yes' : 'No', inline: true },
                    { name: 'Created', value: `<t:${Math.floor(emoji.createdTimestamp / 1000)}:F>`, inline: true },
                    { name: 'URL', value: `[Click here](${emoji.url})`, inline: true }
                )
                .setColor(0x5865F2)
                .setTimestamp();

            if (emoji.guild) {
                embed.addFields({ name: 'Server', value: emoji.guild.name, inline: true });
            }

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ 
                content: 'Failed to fetch emoji information.', 
                ephemeral: true 
            });
        }
    },

    async handleEmojiSteal(interaction) {
        const emojiInput = interaction.options.getString('emoji');
        const customName = interaction.options.getString('name');
        
        // Parse emoji from input
        const emojiMatch = emojiInput.match(/<a?:(\w+):(\d+)>/);
        
        if (!emojiMatch) {
            await interaction.reply({ 
                content: 'Please provide a valid custom emoji to steal.', 
                ephemeral: true 
            });
            return;
        }

        const [fullMatch, originalName, emojiId] = emojiMatch;
        const emojiName = customName || originalName;
        const isAnimated = fullMatch.startsWith('<a:');
        const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}`;

        try {
            // Check if emoji name already exists
            const existingEmoji = interaction.guild.emojis.cache.find(e => e.name === emojiName);
            if (existingEmoji) {
                await interaction.reply({ 
                    content: `An emoji with the name "${emojiName}" already exists in this server.`, 
                    ephemeral: true 
                });
                return;
            }

            // Create the emoji
            const newEmoji = await interaction.guild.emojis.create({
                attachment: emojiUrl,
                name: emojiName,
                reason: `Emoji stolen by ${interaction.user.tag}`
            });

            const embed = new EmbedBuilder()
                .setTitle('Emoji Stolen Successfully!')
                .setDescription(`${newEmoji} has been added to this server.`)
                .addFields(
                    { name: 'Name', value: newEmoji.name, inline: true },
                    { name: 'ID', value: newEmoji.id, inline: true },
                    { name: 'Animated', value: newEmoji.animated ? 'Yes' : 'No', inline: true }
                )
                .setThumbnail(newEmoji.url)
                .setColor(0x00FF00)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error stealing emoji:', error);
            let errorMessage = 'Failed to steal the emoji. ';
            
            if (error.code === 30008) {
                errorMessage += 'This server has reached the maximum number of emojis.';
            } else if (error.code === 50013) {
                errorMessage += 'Bot lacks permissions to manage emojis.';
            } else {
                errorMessage += 'Please try again later.';
            }

            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    },

    async handleEmojiDelete(interaction) {
        const emojiInput = interaction.options.getString('emoji');
        
        // Parse emoji ID from input
        const emojiMatch = emojiInput.match(/<a?:(\w+):(\d+)>/);
        
        if (!emojiMatch) {
            await interaction.reply({ 
                content: 'Please provide a valid custom emoji to delete.', 
                ephemeral: true 
            });
            return;
        }

        const [, emojiName, emojiId] = emojiMatch;
        
        try {
            // Find the emoji in the current guild
            const emoji = interaction.guild.emojis.cache.get(emojiId);
            
            if (!emoji) {
                await interaction.reply({ 
                    content: 'Emoji not found in this server.', 
                    ephemeral: true 
                });
                return;
            }

            // Delete the emoji
            await emoji.delete(`Emoji deleted by ${interaction.user.tag}`);

            const embed = new EmbedBuilder()
                .setTitle('Emoji Deleted Successfully!')
                .setDescription(`The emoji "${emojiName}" has been removed from this server.`)
                .setColor(0xFF0000)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error deleting emoji:', error);
            let errorMessage = 'Failed to delete the emoji. ';
            
            if (error.code === 50013) {
                errorMessage += 'Bot lacks permissions to manage emojis.';
            } else {
                errorMessage += 'Please try again later.';
            }

            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    }
};
