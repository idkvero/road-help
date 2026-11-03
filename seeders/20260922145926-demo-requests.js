"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    const [owners] = await queryInterface.sequelize.query(
      `SELECT id FROM "Users" ORDER BY (role = 'admin') DESC, id ASC LIMIT 1`,
    );

    const userId = owners.length > 0 ? owners[0].id : null;

    await queryInterface.bulkInsert("Requests", [
      {
        description: "Разрядился аккумулятор",
        location: "Минск, ул. Ленина, 10",
        status: "new",
        phone: "+375291111111",
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        description: "Спустило колесо",
        location: "Минск, проспект Победителей, 25",
        status: "in_progress",
        phone: "+375292222222",
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        description: "Не заводится автомобиль",
        location: "Минск, ул. Сурганова, 15",
        status: "new",
        phone: "+375293333333",
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Requests", null, {});
  },
};
