const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const adminProductsSchema = mongoose.Schema({
    uid: {
        type: String,
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    companyName: {
        type: String,
        required: true
    }

})



const AdminProducts = mongoose.model('AdminProduct', adminProductsSchema)

module.exports = AdminProducts