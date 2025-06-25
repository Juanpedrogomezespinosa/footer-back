const { Comment, User, Product } = require("../models");

// Crear un nuevo comentario para un producto
exports.createComment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, content } = req.body;

    // Validar que exista producto
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    if (!content || content.trim() === "") {
      return res
        .status(400)
        .json({ message: "El contenido del comentario es obligatorio" });
    }

    const comment = await Comment.create({ userId, productId, content });

    res
      .status(201)
      .json({ message: "Comentario creado correctamente", comment });
  } catch (error) {
    next(error);
  }
};

// Obtener todos los comentarios de un producto
exports.getCommentsByProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    const comments = await Comment.findAll({
      where: { productId },
      include: [
        {
          model: User,
          attributes: ["id", "username", "email"], // Cambiado "name" por "username"
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json(comments);
  } catch (error) {
    next(error);
  }
};

// Eliminar un comentario (solo el autor puede eliminar su comentario)
exports.deleteComment = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const comment = await Comment.findByPk(id);

    if (!comment) {
      return res.status(404).json({ message: "Comentario no encontrado" });
    }

    if (comment.userId !== userId) {
      return res
        .status(403)
        .json({ message: "No tienes permiso para eliminar este comentario" });
    }

    await comment.destroy();

    res.json({ message: "Comentario eliminado correctamente" });
  } catch (error) {
    next(error);
  }
};
