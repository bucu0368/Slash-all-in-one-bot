
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Role management commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(subcommand =>
            subcommand
                .setName('all')
                .setDescription('Add a role to all members')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to add to all members')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('removeall')
                .setDescription('Remove a role from all members')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to remove from all members')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to a specific user')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to add')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to add the role to')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from a specific user')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to remove')
                        .setRequired(true)
                )
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User to remove the role from')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('name')
                .setDescription('Change the name of a role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to rename')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('New name for the role')
                        .setRequired(true)
                        .setMaxLength(100)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete a role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to delete')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('color')
                .setDescription('Change the color of a role')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to change color')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('New color (hex code like #FF0000 or color name)')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        // Check if bot has MANAGE_ROLES permission
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
            await interaction.reply({ 
                content: 'I need the "Manage Roles" permission to execute this command.', 
                ephemeral: true 
            });
            return;
        }

        // Check if user has MANAGE_ROLES permission
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            await interaction.reply({ 
                content: 'You need the "Manage Roles" permission to use this command.', 
                ephemeral: true 
            });
            return;
        }

        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'all':
                    await this.handleRoleAll(interaction);
                    break;
                case 'removeall':
                    await this.handleRoleRemoveAll(interaction);
                    break;
                case 'add':
                    await this.handleRoleAdd(interaction);
                    break;
                case 'remove':
                    await this.handleRoleRemove(interaction);
                    break;
                case 'name':
                    await this.handleRoleName(interaction);
                    break;
                case 'delete':
                    await this.handleRoleDelete(interaction);
                    break;
                case 'color':
                    await this.handleRoleColor(interaction);
                    break;
            }
        } catch (error) {
            console.error(error);
            const errorMessage = error.message.includes('Missing Permissions') 
                ? 'I don\'t have permission to manage this role. Make sure my role is higher than the target role.'
                : 'An error occurred while processing your request.';
            
            if (interaction.replied) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        }
    },

    async handleRoleAll(interaction) {
        const role = interaction.options.getRole('role');
        
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            await interaction.reply({ 
                content: 'I cannot manage this role because it is higher than or equal to my highest role.', 
                ephemeral: true 
            });
            return;
        }

        await interaction.deferReply();

        const members = await interaction.guild.members.fetch();
        const membersWithoutRole = members.filter(member => !member.roles.cache.has(role.id) && !member.user.bot);
        
        let successCount = 0;
        let failCount = 0;

        for (const member of membersWithoutRole.values()) {
            try {
                await member.roles.add(role);
                successCount++;
            } catch (error) {
                failCount++;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('Role Added to All Members')
            .setDescription(`Successfully added **${role.name}** to ${successCount} members.${failCount > 0 ? `\nFailed to add to ${failCount} members.` : ''}`)
            .setColor(role.color || 0x00AE86)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },

    async handleRoleRemoveAll(interaction) {
        const role = interaction.options.getRole('role');
        
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            await interaction.reply({ 
                content: 'I cannot manage this role because it is higher than or equal to my highest role.', 
                ephemeral: true 
            });
            return;
        }

        await interaction.deferReply();

        const members = await interaction.guild.members.fetch();
        const membersWithRole = members.filter(member => member.roles.cache.has(role.id));
        
        let successCount = 0;
        let failCount = 0;

        for (const member of membersWithRole.values()) {
            try {
                await member.roles.remove(role);
                successCount++;
            } catch (error) {
                failCount++;
            }
        }

        const embed = new EmbedBuilder()
            .setTitle('Role Removed from All Members')
            .setDescription(`Successfully removed **${role.name}** from ${successCount} members.${failCount > 0 ? `\nFailed to remove from ${failCount} members.` : ''}`)
            .setColor(role.color || 0x00AE86)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },

    async handleRoleAdd(interaction) {
        const role = interaction.options.getRole('role');
        const user = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id);

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            await interaction.reply({ 
                content: 'I cannot manage this role because it is higher than or equal to my highest role.', 
                ephemeral: true 
            });
            return;
        }

        if (member.roles.cache.has(role.id)) {
            await interaction.reply({ 
                content: `${user.tag} already has the **${role.name}** role.`, 
                ephemeral: true 
            });
            return;
        }

        await member.roles.add(role);

        const embed = new EmbedBuilder()
            .setTitle('Role Added')
            .setDescription(`Successfully added **${role.name}** to ${user.tag}`)
            .setColor(role.color || 0x00AE86)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleRoleRemove(interaction) {
        const role = interaction.options.getRole('role');
        const user = interaction.options.getUser('user');
        const member = await interaction.guild.members.fetch(user.id);

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            await interaction.reply({ 
                content: 'I cannot manage this role because it is higher than or equal to my highest role.', 
                ephemeral: true 
            });
            return;
        }

        if (!member.roles.cache.has(role.id)) {
            await interaction.reply({ 
                content: `${user.tag} doesn't have the **${role.name}** role.`, 
                ephemeral: true 
            });
            return;
        }

        await member.roles.remove(role);

        const embed = new EmbedBuilder()
            .setTitle('Role Removed')
            .setDescription(`Successfully removed **${role.name}** from ${user.tag}`)
            .setColor(role.color || 0x00AE86)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleRoleName(interaction) {
        const role = interaction.options.getRole('role');
        const newName = interaction.options.getString('name');

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            await interaction.reply({ 
                content: 'I cannot manage this role because it is higher than or equal to my highest role.', 
                ephemeral: true 
            });
            return;
        }

        const oldName = role.name;
        await role.setName(newName);

        const embed = new EmbedBuilder()
            .setTitle('Role Name Changed')
            .setDescription(`Successfully changed role name from **${oldName}** to **${newName}**`)
            .setColor(role.color || 0x00AE86)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleRoleDelete(interaction) {
        const role = interaction.options.getRole('role');

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            await interaction.reply({ 
                content: 'I cannot manage this role because it is higher than or equal to my highest role.', 
                ephemeral: true 
            });
            return;
        }

        if (role.managed) {
            await interaction.reply({ 
                content: 'I cannot delete this role because it is managed by an integration.', 
                ephemeral: true 
            });
            return;
        }

        const roleName = role.name;
        await role.delete();

        const embed = new EmbedBuilder()
            .setTitle('Role Deleted')
            .setDescription(`Successfully deleted the **${roleName}** role`)
            .setColor(0xFF0000)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleRoleColor(interaction) {
        const role = interaction.options.getRole('role');
        const colorInput = interaction.options.getString('color');

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            await interaction.reply({ 
                content: 'I cannot manage this role because it is higher than or equal to my highest role.', 
                ephemeral: true 
            });
            return;
        }

        let color;
        
        // Handle hex color codes
        if (colorInput.startsWith('#')) {
            color = parseInt(colorInput.slice(1), 16);
            if (isNaN(color)) {
                await interaction.reply({ 
                    content: 'Invalid hex color code. Please use format like #FF0000', 
                    ephemeral: true 
                });
                return;
            }
        } else {
            // Handle color names
            const colorMap = {
                'red': 0xFF0000,
                'green': 0x00FF00,
                'blue': 0x0000FF,
                'yellow': 0xFFFF00,
                'orange': 0xFFA500,
                'purple': 0x800080,
                'pink': 0xFFC0CB,
                'cyan': 0x00FFFF,
                'white': 0xFFFFFF,
                'black': 0x000000,
                'gray': 0x808080,
                'grey': 0x808080
            };
            
            color = colorMap[colorInput.toLowerCase()];
            if (color === undefined) {
                await interaction.reply({ 
                    content: 'Invalid color name or hex code. Use color names like "red", "blue" or hex codes like "#FF0000"', 
                    ephemeral: true 
                });
                return;
            }
        }

        await role.setColor(color);

        const embed = new EmbedBuilder()
            .setTitle('Role Color Changed')
            .setDescription(`Successfully changed **${role.name}** color to ${colorInput}`)
            .setColor(color)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
