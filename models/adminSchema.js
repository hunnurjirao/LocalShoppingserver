const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const adminSchema = mongoose.Schema({

    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    cpassword: {
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
    },
    imageUrl: {
        type: String
    },
    tokens: [
        {
            token1: {
                type: String,
                required: true
            }
        }
    ],
    orders: [
        {
            userid: {
                type: String,
                required: true
            },
            productid: {
                type: String,
                required: true
            },
            quantity: {
                type: Number,
                required: true
            },
            phone: {
                type: Number,
                required: true
            },
            date: {
                type: Date,
                default: Date.now
            },
            status: {
                type: Boolean
            }
        }
    ]

})

adminSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12)
        this.cpassword = await bcrypt.hash(this.cpassword, 12)
    }
    next();
})


adminSchema.methods.generateAuthToken = async function () {
    try {
        let token = jwt.sign({ _id: this._id }, process.env.SECRET_KEY)
        this.tokens = this.tokens.concat({ token1: token })
        await this.save()
        return token;

    } catch (error) {
        console.log(error);
    }
}


const Admin = mongoose.model('Admin', adminSchema)

module.exports = Admin