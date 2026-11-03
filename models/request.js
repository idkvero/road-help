"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Request extends Model {
    static associate(models) {
      Request.belongsTo(models.User, { foreignKey: "userId" });
    }
  }
  Request.init(
    {
      description: DataTypes.STRING,
      location: DataTypes.STRING,
      status: DataTypes.STRING,
      phone: DataTypes.STRING,
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Request",
    },
  );
  return Request;
};
