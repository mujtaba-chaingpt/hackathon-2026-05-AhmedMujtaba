'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('game_sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      difficulty: {
        type: Sequelize.ENUM('easy', 'medium', 'hard'),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'won', 'lost', 'expired'),
        allowNull: false,
        defaultValue: 'active',
      },
      case_data: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      hint_used: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      coin_cost: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      started_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      ended_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      accused_suspect_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('game_sessions', ['user_id'], {
      name: 'game_sessions_user_id_idx',
    });

    await queryInterface.addIndex('game_sessions', ['status'], {
      name: 'game_sessions_status_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('game_sessions');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_game_sessions_difficulty";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_game_sessions_status";');
  },
};
