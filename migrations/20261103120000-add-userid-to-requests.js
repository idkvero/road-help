"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Requests", "userId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "Users", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.sequelize.query(
      `UPDATE "Requests" SET "userId" = (SELECT id FROM "Users" WHERE role = 'admin' ORDER BY id LIMIT 1) WHERE "userId" IS NULL`,
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("Requests", "userId");
  },
};
