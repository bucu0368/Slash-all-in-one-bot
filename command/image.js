
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('image')
        .setDescription('Display images of various animals')
        .addSubcommand(subcommand =>
            subcommand
                .setName('dog')
                .setDescription('Display a random dog image')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('cat')
                .setDescription('Display a random cat image')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('koala')
                .setDescription('Display a random koala image')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('panda')
                .setDescription('Display a random panda image')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('redpanda')
                .setDescription('Display a random red panda image')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('avatar')
                .setDescription('Display a user\'s avatar')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to get avatar from')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('banner')
                .setDescription('Display a user\'s banner')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to get banner from')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'dog':
                    await this.handleDogImage(interaction);
                    break;
                case 'cat':
                    await this.handleCatImage(interaction);
                    break;
                case 'koala':
                    await this.handleKoalaImage(interaction);
                    break;
                case 'panda':
                    await this.handlePandaImage(interaction);
                    break;
                case 'redpanda':
                    await this.handleRedPandaImage(interaction);
                    break;
                case 'avatar':
                    await this.handleAvatarImage(interaction);
                    break;
                case 'banner':
                    await this.handleBannerImage(interaction);
                    break;
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: 'An error occurred while fetching the image. Please try again later.', 
                ephemeral: true 
            });
        }
    },

    async handleDogImage(interaction) {
        try {
            const response = await fetch('https://dog.ceo/api/breeds/image/random');
            const data = await response.json();

            if (data.status === 'success') {
                const embed = new EmbedBuilder()
                    .setTitle('🐕 Random Dog')
                    .setImage(data.message)
                    .setColor(0x8B4513)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            } else {
                throw new Error('Failed to fetch dog image');
            }
        } catch (error) {
            await interaction.reply({ 
                content: 'Failed to fetch a dog image. Please try again later.', 
                ephemeral: true 
            });
        }
    },

    async handleCatImage(interaction) {
        try {
            const response = await fetch('https://api.thecatapi.com/v1/images/search');
            const data = await response.json();

            if (data && data[0] && data[0].url) {
                const embed = new EmbedBuilder()
                    .setTitle('🐱 Random Cat')
                    .setImage(data[0].url)
                    .setColor(0xFF69B4)
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            } else {
                throw new Error('Failed to fetch cat image');
            }
        } catch (error) {
            await interaction.reply({ 
                content: 'Failed to fetch a cat image. Please try again later.', 
                ephemeral: true 
            });
        }
    },

    async handleKoalaImage(interaction) {
        // Using a static koala image as there's no free koala API
        const koalaImages = [
            'https://images.unsplash.com/photo-1459262838948-3e2de6c1ec80?w=800',
            'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800',
            'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=800',
            'https://images.unsplash.com/photo-1516642898547-0c0e19a80163?w=800',
            'https://images.unsplash.com/photo-1540479859555-17af45c78602?w=800'
        ];

        const randomImage = koalaImages[Math.floor(Math.random() * koalaImages.length)];

        const embed = new EmbedBuilder()
            .setTitle('🐨 Random Koala')
            .setImage(randomImage)
            .setColor(0x708090)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handlePandaImage(interaction) {
        // Using static panda images as there's no free panda API
        const pandaImages = [
            'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=800',
            'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=800',
            'https://images.unsplash.com/photo-1539681944410-7c1234be3b1e?w=800',
            'https://images.unsplash.com/photo-1565549106264-d7a99c2dc354?w=800',
            'https://images.unsplash.com/photo-1569435875285-1a8dae2ef55c?w=800'
        ];

        const randomImage = pandaImages[Math.floor(Math.random() * pandaImages.length)];

        const embed = new EmbedBuilder()
            .setTitle('🐼 Random Panda')
            .setImage(randomImage)
            .setColor(0x000000)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleRedPandaImage(interaction) {
        // Using static red panda images
        const redPandaImages = [
            'https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=800',
            'https://images.unsplash.com/photo-1618436917653-e2a96d6b2cf6?w=800',
            'https://images.unsplash.com/photo-1612024691703-1e22b2c0de34?w=800',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
            'https://images.unsplash.com/photo-1472491235688-bdc81a63246e?w=800'
        ];

        const randomImage = redPandaImages[Math.floor(Math.random() * redPandaImages.length)];

        const embed = new EmbedBuilder()
            .setTitle('🦝 Random Red Panda')
            .setImage(randomImage)
            .setColor(0xFF4500)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleAvatarImage(interaction) {
        const user = interaction.options.getUser('user');
        
        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s Avatar`)
            .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
            .setColor(0x5865F2)
            .setTimestamp()
            .setFooter({ text: `Requested by ${interaction.user.username}` });

        await interaction.reply({ embeds: [embed] });
    },

    async handleBannerImage(interaction) {
        const user = interaction.options.getUser('user');
        
        try {
            // Fetch the user to get banner information
            const fetchedUser = await user.fetch(true);
            const bannerUrl = fetchedUser.bannerURL({ dynamic: true, size: 1024 });
            
            if (!bannerUrl) {
                await interaction.reply({ 
                    content: `${user.username} doesn't have a banner set.`, 
                    ephemeral: true 
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle(`${user.username}'s Banner`)
                .setImage(bannerUrl)
                .setColor(0x5865F2)
                .setTimestamp()
                .setFooter({ text: `Requested by ${interaction.user.username}` });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching user banner:', error);
            await interaction.reply({ 
                content: 'Failed to fetch user banner. Please try again later.', 
                ephemeral: true 
            });
        }
    }
};
