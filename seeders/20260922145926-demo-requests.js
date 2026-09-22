"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert("Requests", [
      {
        description: "Разрядился аккумулятор",
        location: "Минск, ул. Ленина, 10",
        status: "new",
        phone: "+375291111111",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        description: "Спустило колесо",
        location: "Минск, проспект Победителей, 25",
        status: "in_progress",
        phone: "+375292222222",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        description: "Не заводится автомобиль",
        location: "Минск, ул. Сурганова, 15",
        status: "new",
        phone: "+375293333333",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("Requests", null, {});
  },
};
