const Admin = require('../models/adminSchema')
const jwt = require('jsonwebtoken');

const AuthenticateAdmin = async (req, res, next) => {

    try {

        const token = req.cookies.jwtoken
        const verifyToken = jwt.verify(token, process.env.SECRET_KEY)

        const rootUser = await Admin.findOne({ _id: verifyToken._id, "tokens.token1": token });

        if (!rootUser) { throw new Error('User Not Found') }

        req.token = token;
        req.rootUser = rootUser;
        req.userID = rootUser._id;
        console.log('token found');
        next();

    } catch (error) {
        res.status(401).send("Unauthorized: No tokens Provided")

    }
}

module.exports = AuthenticateAdmin