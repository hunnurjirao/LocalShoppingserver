const express = require('express');
const jwt = require('jsonwebtoken')
const router = express.Router()
const bcrypt = require('bcryptjs');
const authenticateUser = require('../middleware/authenticateUser')
const authenticateAdmin = require('../middleware/authenticateAdmin')
require('../db/conn')
const User = require('../models/userSchema')
const cookieParser = require("cookie-parser");
router.use(cookieParser());
const Admin = require('../models/adminSchema')
const AdminProducts = require('../models/adminProductsSchema')

router.post('/addProduct', async (req, res) => {
    const { productName, price, uid, email, phone, companyName } = req.body;

    if (!productName || !price || !uid, !email || !phone || !companyName) {
        return res.status(422).json({ error: "Please fill the required fields!" })
    }

    try {
        const product = new AdminProducts({ productName, price, uid, email, phone, companyName })

        await product.save();


        res.status(201).json({ message: "Product Added Successfully!" })
    } catch (error) {
        console.log(error);
    }
})

router.post('/adminRegister', async (req, res) => {

    const { email, password, cpassword, phone, companyName } = req.body

    if (!email || !password || !cpassword || !phone || !companyName) {
        return res.status(422).json({ error: "Please fill the required fields!" })
    }

    try {
        const userExists = await Admin.findOne({ email: email })

        if (userExists) {

            return res.status(422).json({ error: "User already exists!" })

        } else if (password != cpassword) {

            return res.status(422).json({ error: "Passwords not matching" })

        } else {

            const admin = new Admin({ email, password, cpassword, phone, companyName })

            await admin.save();

            let token = await admin.generateAuthToken()
            // res.status(201).json({ message: "Registration Successful!" })
            res.send({ token })
        }


    } catch (error) {
        console.log(error);
    }

})

router.post('/userRegister', async (req, res) => {

    const { email, phone, password, cpassword, username } = req.body

    if (!email || !password || !cpassword || !phone || !username) {
        return res.status(422).json({ error: "Please fill the required fields!" })
    }

    try {
        const userExists = await User.findOne({ email: email })

        if (userExists) {

            return res.status(422).json({ error: "User already exists!" })

        } else if (password != cpassword) {

            return res.status(422).json({ error: "Passwords not matching" })

        } else {

            const user = new User({ email, password, cpassword, phone, username })

            await user.save();

            let token = await user.generateAuthToken()
            // res.status(201).json({ message: "Registration Successful!" })
            res.send({ token })
        }


    } catch (error) {
        console.log(error);
    }

})

router.post('/adminLogin', async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(422).json({ error: "Please fill the required fields!" })
    }

    try {
        const adminLogin = await Admin.findOne({ email: email })

        if (adminLogin) {
            const isMatch = await bcrypt.compare(password, adminLogin.password);

            let token = await adminLogin.generateAuthToken()

            res.cookie("jwtoken", token, {
                expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
                httpOnly: true
            });

            if (!isMatch) {
                res.status(400).json({ error: "Invalid Login Credentials" })

            } else {
                // res.status(201).json({ message: "Signin Successful!" })
                res.send({ token })

            }
        } else {
            res.status(400).json({ error: "Invalid Login Credentials" })

        }
    } catch (error) {
        console.log(error);
    }
})

router.post('/userLogin', async (req, res) => {

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(422).json({ error: "Please fill the required fields!" })
    }

    try {
        const userLogin = await User.findOne({ email: email })

        if (userLogin) {
            const isMatch = await bcrypt.compare(password, userLogin.password);

            let token = await userLogin.generateAuthToken()

            res.cookie("jwtoken", token, {
                expires: new Date(Date.now() + 1000 * 60 * 60 * 24),
                httpOnly: true
            });

            if (!isMatch) {
                res.status(400).json({ error: "Invalid Login Credentials" })

            } else {
                // res.status(201).json({ message: "Signin Successful!" })
                res.send({ token })

            }
        } else {
            res.status(400).json({ error: "Invalid Login Credentials" })

        }
    } catch (error) {
        console.log(error);
    }
})

router.get('/getAdminData', authenticateAdmin, (req, res) => {
    res.send(req.rootUser)
})

router.get('/getUserData', authenticateUser, (req, res) => {
    res.send(req.rootUser)
})

router.get('/getAdminProducts', async (req, res) => {
    await AdminProducts.find({}, (err, result) => {
        res.send(result)
    })

})

router.get('/getUserbyId', async (req, res) => {
    await User.find({}, (err, result) => {

        res.send(result)
    })
})

router.put('/adminOrders', async (req, res) => {

    try {
        var prod = {
            userid: req.body.uid,
            productid: req.body.pid,
            quantity: req.body.quantity,
            phone: req.body.phone
        }
        const isadded = await Admin.find({ orders: { $elemMatch: prod } });

        if (!(isadded.length > 0)) {
            await Admin.findOneAndUpdate(
                { companyName: req.body.companyName },
                {
                    $addToSet:
                        { orders: prod }
                },
                { useFindAndModify: false },
                function (error, success) {
                    if (error) {
                        console.log(error);
                    }
                });

            res.status(200).send("added to order list Successfully!")
        } else {
            res.status(401).send("product already added!")

        }

    } catch (error) {
        console.log(error);
    }
})

router.put('/yourOrders', async (req, res) => {

    try {
        var prod = {
            companyName: req.body.companyName,
            productid: req.body.pid,
            quantity: req.body.quantity
        }
        const isadded = await User.find({ yourOrders: { $elemMatch: prod } });

        if (!(isadded.length > 0)) {
            await User.findOneAndUpdate(
                { _id: req.body.uid },
                {
                    $addToSet:
                        { yourOrders: prod }
                },
                { useFindAndModify: false },
                function (error, success) {
                    if (error) {
                        console.log(error);
                    }
                });

            res.status(200).send("added to order list Successfully!")
        } else {
            res.status(401).send("product already added!")

        }

    } catch (error) {
        console.log(error);
    }
})

router.put('/addCartProducts', async (req, res) => {

    try {
        var prod = {
            cartProductName: req.body.product,
            cartProductPrice: req.body.price,
            cartProductCompanyName: req.body.companyName
        }
        const isadded = await User.find({ cartProducts: { $elemMatch: prod } });

        if (!(isadded.length > 0)) {
            await User.findOneAndUpdate(
                { _id: req.body.uid },
                {
                    $addToSet:
                        { cartProducts: prod }
                },
                { useFindAndModify: false },
                function (error, success) {
                    if (error) {
                        console.log(error);
                    }
                });

            res.status(200).send("added to cart Successfully!")
        } else {
            res.status(401).send("product already added!")

        }

    } catch (error) {
        console.log(error);
    }
})

router.put('/delOrder', async (req, res) => {

    try {
        await User.findOneAndUpdate(
            { _id: req.body.uid },
            {
                $pull:
                    { yourOrders: { _id: req.body.p_id } } //products _id
            },
            { useFindAndModify: false },
            function (error, success) {
                if (error) {
                    console.log(error);
                }
            });

        await Admin.findOneAndUpdate(
            { companyName: req.body.companyName, },
            {
                $pull:
                    { orders: { userid: req.body.uid, productid: req.body.pid } } // ...<=>...
            },
            { useFindAndModify: false },
            function (error, success) {
                if (error) {
                    console.log(error);
                }
            });


        res.status(200).send("Order cancelled.")

    } catch (error) {
        console.log(error);
    }
})

router.put('/delCartProducts', async (req, res) => {

    try {
        await User.findOneAndUpdate(
            { _id: req.body.uid },
            {
                $pull:
                    { cartProducts: { _id: req.body.pid } }
            },
            { useFindAndModify: false },
            function (error, success) {
                if (error) {
                    console.log(error);
                }
            });
        res.status(200).send("Product removed from cart.")

    } catch (error) {
        console.log(error);
    }
})

router.put('/editProduct', async (req, res) => {


    try {

        await AdminProducts.findOneAndUpdate(
            { _id: req.body.uid },
            {
                $set: {
                    productName: req.body.productName,
                    price: req.body.price
                }
            },
            {
                new: true,
                useFindAndModify: false
            }
        )

    } catch (error) {
        console.log(error);
    }
})

router.put('/editAdminStatus', async (req, res) => {
    try {
        await Admin.findOneAndUpdate(
            { orders: { _id: req.body.uid } },
            {
                $set: {
                    orders: { status: req.body.status }

                }
            },
            {
                new: true,
                useFindAndModify: false
            }
        )

        res.status(201).json({ message: "Status Updated" })


    } catch (error) {
        console.log(error);
    }
})

router.put('/editUserStatus', async (req, res) => {
    try {
        await User.findOneAndUpdate(
            { orders: { _id: req.body.uid } },
            {
                $set: {
                    orders: { status: req.body.status }

                }
            },
            {
                new: true,
                useFindAndModify: false
            }
        )
        res.status(201).json({ message: "Status Updated" })


    } catch (error) {
        console.log(error);
    }
})

router.delete('/deleteProduct', async (req, res) => {
    await AdminProducts.deleteOne(
        { _id: req.body._id }
    )
})

router.put('/editAdmin', async (req, res) => {

    try {

        await Admin.findOneAndUpdate(
            { _id: req.body.uid },
            {
                $set: {
                    companyName: req.body.companyName,
                    email: req.body.email,
                    phone: req.body.phone,
                    imageUrl: req.body.imageUrl
                }
            },
            {
                new: true,
                useFindAndModify: false
            }
        )

    } catch (error) {
        console.log(error);
    }
})

router.put('/editUser', async (req, res) => {

    try {

        await User.findOneAndUpdate(
            { _id: req.body.uid },
            {
                $set: {
                    username: req.body.username,
                    email: req.body.email,
                    phone: req.body.phone,
                    imageUrl: req.body.imageUrl
                }
            },
            {
                new: true,
                useFindAndModify: false
            }
        )

    } catch (error) {
        console.log(error);
    }
})

router.put('/logoutUser', async (req, res) => {
    // req.data.tokens = [];
    // res.clearCookie('jwtoken')
    // await req.rootUser.save();
    try {

        await User.findOneAndUpdate(
            { _id: req.body.uid },
            {
                $set: {
                    tokens: []
                }
            },
            {
                new: true,
                useFindAndModify: false
            }
        )
        res.status(200).send("Logout Successfully!")

    } catch (error) {
        console.log(error);
    }
})

router.put('/logoutAdmin', async (req, res) => {
    // req.data.tokens = [];
    // res.clearCookie('jwtoken')
    // await req.rootUser.save();
    try {

        await Admin.findOneAndUpdate(
            { _id: req.body.uid },
            {
                $set: {
                    tokens: []
                }
            },
            {
                new: true,
                useFindAndModify: false
            }
        )
        res.status(200).send("Logout Successfully!")

    } catch (error) {
        console.log(error);
    }
})


module.exports = router