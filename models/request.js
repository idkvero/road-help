"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Request extends Model {
    
    static associate(models) {
      // define association here
    }
  }
  Request.init(
    {
      description: DataTypes.STRING,
      location: DataTypes.STRING,
      status: DataTypes.STRING,
      phone: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Request",
    },
  );
  return Request;
};
