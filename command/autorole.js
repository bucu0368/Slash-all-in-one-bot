
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Manage auto-roles for new members')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all auto-roles')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to auto-roles')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to add to auto-roles')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from auto-roles')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('Role to remove from auto-roles')
                        .setRequired(true)
                )
        ),

    // Store auto-roles in memory (in production, use a database)
    autoRoles: new Map(),

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
                case 'list':
                    await this.handleList(interaction);
                    break;
                case 'add':
                    await this.handleAdd(interaction);
                    break;
                case 'remove':
                    await this.handleRemove(interaction);
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

    async handleList(interaction) {
        const guildId = interaction.guild.id;
        const autoRoles = this.autoRoles.get(guildId) || [];

        if (autoRoles.length === 0) {
            await interaction.reply({ 
                content: 'No auto-roles have been set up for this server.', 
                ephemeral: true 
            });
            return;
        }

        const roleList = autoRoles.map(roleId => {
            const role = interaction.guild.roles.cache.get(roleId);
            return role ? `• ${role.name} (${role.id})` : `• Deleted Role (${roleId})`;
        }).join('\n');

        const embed = new EmbedBuilder()
            .setTitle('Auto-Roles List')
            .setDescription(roleList)
            .setColor(0x00AE86)
            .setFooter({ text: `${autoRoles.length} auto-role(s) configured` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleAdd(interaction) {
        const role = interaction.options.getRole('role');
        const guildId = interaction.guild.id;

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            await interaction.reply({ 
                content: 'I cannot manage this role because it is higher than or equal to my highest role.', 
                ephemeral: true 
            });
            return;
        }

        if (role.managed) {
            await interaction.reply({ 
                content: 'I cannot add this role to auto-roles because it is managed by an integration.', 
                ephemeral: true 
            });
            return;
        }

        const autoRoles = this.autoRoles.get(guildId) || [];
        
        if (autoRoles.includes(role.id)) {
            await interaction.reply({ 
                content: `**${role.name}** is already in the auto-roles list.`, 
                ephemeral: true 
            });
            return;
        }

        autoRoles.push(role.id);
        this.autoRoles.set(guildId, autoRoles);

        const embed = new EmbedBuilder()
            .setTitle('Auto-Role Added')
            .setDescription(`Successfully added **${role.name}** to auto-roles.\nNew members will automatically receive this role.`)
            .setColor(role.color || 0x00AE86)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    async handleRemove(interaction) {
        const role = interaction.options.getRole('role');
        const guildId = interaction.guild.id;

        const autoRoles = this.autoRoles.get(guildId) || [];
        
        if (!autoRoles.includes(role.id)) {
            await interaction.reply({ 
                content: `**${role.name}** is not in the auto-roles list.`, 
                ephemeral: true 
            });
            return;
        }

        const updatedAutoRoles = autoRoles.filter(roleId => roleId !== role.id);
        this.autoRoles.set(guildId, updatedAutoRoles);

        const embed = new EmbedBuilder()
            .setTitle('Auto-Role Removed')
            .setDescription(`Successfully removed **${role.name}** from auto-roles.\nNew members will no longer automatically receive this role.`)
            .setColor(role.color || 0x00AE86)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
