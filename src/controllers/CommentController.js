const ProductoModel = require('../models/ProductModel');
const User = require("../models/UserModel");

const calcularMediaValoracion = (votosPrevios, nuevoVoto, totalVotos) => {
  const sumaTotal = votosPrevios * (totalVotos - 1) + nuevoVoto;
  return Math.min(Math.max(sumaTotal / totalVotos, 1), 5);
};

const CommentController = {
  async addComment(req, res) {
    try {
      const { productId, productName, productImage, productDescription, comment, rating, username, uid } = req.body;
      
      if (!productId || !productName || !productImage || !productDescription || !comment || rating === undefined || !username || !uid) {
        return res.status(400).json({ message: 'Faltan datos en la solicitud' });
      }

      const parsedRating = Number(rating);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ message: 'La puntuación debe ser un número entre 1 y 5' });
      }

      const [product, user] = await Promise.all([
        ProductoModel.findById(productId),
        User.findOne({ username })
      ]);

      if (!product || !user) {
        return res.status(404).json({ message: 'Producto o usuario no encontrado' });
      }

      const userId = user._id.toString();

      const newReview = {
        productId,
        userId,
        productName,
        productImage,
        productDescription,
        comment,
        username,
        rating: parsedRating,
        createdAt: new Date()
      };

      product.reviews.push(newReview);

      if (!Array.isArray(product.likes) || product.likes.length === 0) {
        return res.status(500).json({ message: 'Datos de "likes" del producto inválidos' });
      }

      const productLike = product.likes[0];
      const newLikesCount = productLike.likesCount + 1;
      const newStarRating = calcularMediaValoracion(productLike.star, parsedRating, newLikesCount);

      productLike.star = newStarRating;
      productLike.likesCount = newLikesCount;

      await Promise.all([
        product.save(),
        user.updateOne({ $push: { reviews: newReview } })
      ]);

      const updatedRating = {
        star: newStarRating,
        likesCount: newLikesCount
      };

      res.status(201).json({ 
        message: 'Comentario agregado exitosamente', 
        newReview,
        updatedRating
      });
    } catch (error) {
      console.error('Error detallado:', error);
      res.status(500).json({ error: error.message, stack: error.stack });
    }
  }
};

module.exports = CommentController;