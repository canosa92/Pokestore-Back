const User = require("../models/UserModel");
const ProductoModel = require('../models/ProductModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const fetchWishListProducts = async (wishList) => {
    try {
        if (!wishList || wishList.length === 0) return [];
        return await ProductoModel.find({ _id: { $in: wishList } });
    } catch (error) {
        console.error('Error fetching wishlist products:', error);
        return [];
    }
};

const UserController = {

    async register(req, res) {
        const { email, password, role, name, username } = req.body;
        try {
            const existing = await User.findOne({ email });
            if (existing) {
                return res.status(400).json({ message: 'Email ya registrado' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await User.create({
                name,
                username,
                email,
                password: hashedPassword,
                role,
                registrationDate: new Date(),
                wishList: [],
                reviews: [],
                cart: []
            });

            const token = jwt.sign(
                { id: newUser._id, email: newUser.email, role: newUser.role },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.status(201).json({
                message: 'Registration successful',
                user: { id: newUser._id, name, username, email, role },
                token
            });
        } catch (error) {
            console.error("Error al registrar usuario:", error);
            res.status(500).json({ message: 'Error al registrar usuario' });
        }
    },

    async login(req, res) {
        const { email, password } = req.body;
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return res.status(401).json({ message: 'Contraseña incorrecta' });
            }

            const token = jwt.sign(
                { id: user._id, email: user.email, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            res.status(200).json({
                message: 'Inicio de sesión exitoso',
                user: { id: user._id, name: user.name, username: user.username, email: user.email, role: user.role },
                token
            });
        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            res.status(500).json({ message: 'Error al iniciar sesión' });
        }
    },

    async getUserProfile(req, res) {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            let wishListProducts = [];
            if (user.wishList && user.wishList.length > 0) {
                wishListProducts = await ProductoModel.find({ _id: { $in: user.wishList } });
            }

            res.json({ user, wishListProducts });
        } catch (error) {
            console.error('Error al obtener el perfil del usuario:', error);
            res.status(500).json({ message: 'Error del servidor', error: error.message });
        }
    },

    async deleteUser(req, res) {
        const { username } = req.params;
        try {
            const user = await User.findOneAndDelete({ username });
            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
            res.status(200).json({ message: 'Usuario eliminado correctamente' });
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            res.status(500).json({ message: 'Error al eliminar usuario' });
        }
    },

    async addToWishList(req, res) {
        const { productId } = req.body;
        const { userId } = req.params;
        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            if (!user.wishList.includes(productId)) {
                user.wishList.push(productId);
                await user.save();
            }

            const wishListProducts = await fetchWishListProducts(user.wishList);
            res.status(200).json({ message: 'Producto añadido a la lista de deseos', wishList: user.wishList, wishListProducts });
        } catch (error) {
            console.error('Error al añadir a la lista de deseos:', error);
            res.status(500).json({ message: 'Error al añadir a la lista de deseos' });
        }
    },

    async removeFromWishList(req, res) {
        const { productId, userId } = req.body;
        try {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }

            user.wishList = user.wishList.filter(id => id.toString() !== productId);
            await user.save();

            const wishListProducts = await fetchWishListProducts(user.wishList);
            res.status(200).json({ message: 'Producto eliminado de la lista de deseos', wishList: user.wishList, wishListProducts });
        } catch (error) {
            console.error('Error al eliminar de la lista de deseos:', error);
            res.status(500).json({ message: 'Error al eliminar de la lista de deseos' });
        }
    }
};

module.exports = UserController;