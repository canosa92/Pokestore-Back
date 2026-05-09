const mongoose = require('mongoose');
require('dotenv').config();
const ObtenerPokemons = require('../utils/axiosPoke');

const dbConnection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            writeConcern: {
                w: 'majority',
                j: true,
                timeout: 1000
            }
        });
        console.log('Base de datos conectada con éxito');

        // Solo hace el seed si la colección está vacía
        const ProductModel = require('../models/ProductModel');
        const count = await ProductModel.countDocuments();
        if (count === 0) {
            console.log('Base de datos vacía, iniciando seed de Pokémon...');
            await ObtenerPokemons();
            console.log('Seed completado');
        } else {
            console.log(`Base de datos ya tiene ${count} Pokémon, omitiendo seed`);
        }

    } catch (error) {
        console.error(error);
        throw new Error('Error a la hora de iniciar la base de datos');
    }
};

module.exports = dbConnection;