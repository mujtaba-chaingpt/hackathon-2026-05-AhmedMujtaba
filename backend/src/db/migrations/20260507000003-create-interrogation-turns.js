'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('interrogation_turns', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      game_session_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'game_sessions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      suspect_id: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      question: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      answer: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('interrogation_turns', ['game_session_id'], {
      name: 'interrogation_turns_game_session_id_idx',
    });

    await queryInterface.addIndex('interrogation_turns', ['game_session_id', 'suspect_id'], {
      name: 'interrogation_turns_session_suspect_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('interrogation_turns');
  },
};
