const { Rating, Product } = require("../models");

exports.createOrUpdateRating = async (request, response, next) => {
  try {
    const userId = request.user.id;
    const { productId, stars } = request.body;

    const product = await Product.findByPk(productId);
    if (!product) {
      return response.status(404).json({ message: "Producto no encontrado" });
    }

    if (
      stars === undefined ||
      typeof stars !== "number" ||
      stars < 1 ||
      stars > 5
    ) {
      return response
        .status(400)
        .json({ message: "Las estrellas deben ser un número entre 1 y 5" });
    }

    let rating = await Rating.findOne({ where: { userId, productId } });

    if (rating) {
      rating.stars = stars;
      await rating.save();
      return response.json({ message: "Valoración actualizada", rating });
    } else {
      rating = await Rating.create({ userId, productId, stars });
      return response
        .status(201)
        .json({ message: "Valoración creada", rating });
    }
  } catch (error) {
    next(error);
  }
};

exports.getRatingsByProduct = async (request, response, next) => {
  try {
    const { productId } = request.params;

    const ratings = await Rating.findAll({
      where: { productId },
      attributes: ["id", "userId", "stars", "created_at"],
    });

    return response.json(ratings);
  } catch (error) {
    next(error);
  }
};

exports.updateRating = async (request, response, next) => {
  try {
    const userId = request.user.id;
    const { id } = request.params;
    const { stars, comment } = request.body;

    if (
      stars === undefined ||
      typeof stars !== "number" ||
      stars < 1 ||
      stars > 5
    ) {
      return response
        .status(400)
        .json({ message: "Las estrellas deben ser un número entre 1 y 5" });
    }

    const rating = await Rating.findByPk(id);

    if (!rating) {
      return response.status(404).json({ message: "Valoración no encontrada" });
    }

    if (rating.userId !== userId) {
      return response
        .status(403)
        .json({ message: "No tienes permiso para actualizar esta valoración" });
    }

    rating.stars = stars;
    if (comment !== undefined) {
      rating.comment = comment;
    }

    await rating.save();

    return response.json({ message: "Valoración actualizada", rating });
  } catch (error) {
    next(error);
  }
};

exports.deleteRating = async (request, response, next) => {
  try {
    const userId = request.user.id;
    const { id } = request.params;

    const rating = await Rating.findByPk(id);

    if (!rating) {
      return response.status(404).json({ message: "Valoración no encontrada" });
    }

    if (rating.userId !== userId) {
      return response
        .status(403)
        .json({ message: "No tienes permiso para eliminar esta valoración" });
    }

    await rating.destroy();

    return response.json({ message: "Valoración eliminada correctamente" });
  } catch (error) {
    next(error);
  }
};
