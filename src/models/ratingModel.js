const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Rating = sequelize.define(
  "Rating",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "product_id",
    },
    stars: {
      type: DataTypes.TINYINT,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "ratings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "product_id"], // Nombres en snake_case, no camelCase
      },
    ],
  }
);

module.exports = Rating;
