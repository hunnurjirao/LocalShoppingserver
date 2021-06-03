const express = require('express');
const jwt = require('jsonwebtoken')
const router = express.Router()
const bcrypt = require('bcryptjs');
const authenticateUser = require('../middleware/authenticateUser')
const authenticateAdmin = require('../middleware/authenticateAdmin')
require('../db/conn')
const nodemailer = require('nodemailer');
const User = require('../models/userSchema')
const cookieParser = require("cookie-parser");
router.use(cookieParser());
const Admin = require('../models/adminSchema')
const AdminProducts = require('../models/adminProductsSchema')
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'hunnurjirao2000@gmail.com',
        pass: process.env.password
    }
});

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

            res.status(201).json(token)
            // res.send({ token })
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
            res.status(201).json({ token })
            // res.send({  })
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
            phone: req.body.phone,
            status: false
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
            quantity: req.body.quantity,
            status: false
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
        const isadded = await User.findById({ _id: req.body.uid }, { cartProducts: { $elemMatch: prod } });

        if (!(isadded.cartProducts.length > 0)) {
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

        const find = await Admin.findById({ _id: req.body.adminid }, { orders: { $elemMatch: { _id: req.body.uid } } })

        find.orders[0].status = req.body.status;
        const ans = await find.save()

        res.status(201).json({ message: "Status Updated" })


    } catch (error) {
        console.log(error);
    }
})

router.put('/editUserStatus', async (req, res) => {
    try {
        var prod = {

            productid: req.body.pid,
            quantity: req.body.quantity,

        }
        const find = await User.findById({ _id: req.body.uid }, { yourOrders: { $elemMatch: prod } });
        find.yourOrders[0].status = req.body.status;
        const ans = await find.save()


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

        const find = await Admin.findById({ _id: req.body.uid })
        find.email = req.body.email
        find.companyName = req.body.companyName
        find.phone = req.body.phone
        find.imageUrl = req.body.imageUrl

        const ans = await find.save()
        // await Admin.findOneAndUpdate(
        //     { _id: req.body.uid },
        //     {
        //         $set: {
        //             companyName: req.body.companyName,
        //             email: req.body.email,
        //             phone: req.body.phone,
        //             imageUrl: req.body.imageUrl
        //         }
        //     },
        //     {
        //         new: true,
        //         useFindAndModify: false
        //     }
        // )

    } catch (error) {
        console.log(error);
    }
})

router.put('/editUser', async (req, res) => {

    try {
        const find = await User.findById({ _id: req.body.uid })
        find.email = req.body.email
        find.username = req.body.username
        find.phone = req.body.phone
        find.imageUrl = req.body.imageUrl

        const ans = await find.save()
        // await User.findOneAndUpdate(
        //     { _id: req.body.uid },
        //     {
        //         $set: {
        //             username: req.body.username,
        //             email: req.body.email,
        //             phone: req.body.phone,
        //             imageUrl: req.body.imageUrl
        //         }
        //     },
        //     {
        //         new: true,
        //         useFindAndModify: false
        //     }
        // )

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

router.get('/userstoken', async (req, res) => {
    const ans = await User.find({})
    const tokenList = []
    for (var i = 0; i < ans.length; i++) {
        for (var j = 0; j < ans[i].tokens.length; j++) {
            tokenList.push(ans[i].tokens[j].token)
        }
    }
    res.send(tokenList)
})

router.get('/adminstoken', async (req, res) => {
    const ans = await Admin.find({})
    const tokenList = []
    for (var i = 0; i < ans.length; i++) {
        for (var j = 0; j < ans[i].tokens.length; j++) {
            tokenList.push(ans[i].tokens[j].token)
        }
    }
    res.send(tokenList)
})

router.put('/sendsmsUser', async (req, res) => {

    const randNo = Math.floor(1000 + Math.random() * 9000)
    const otp = randNo;
    const userExists = await User.findOne({ phone: req.body.phone })

    if (userExists) {

        res.status(400).json({ error: "Phone number already used" })

    } else {
        const client = require('twilio')(accountSid, authToken);

        await client.messages.create({
            body: `Welcome to Local Shopping! \n Thank you for registering for User Account. Your OTP is ${otp}`,
            to: '+91' + req.body.phone,  // Text this number
            from: '+14806669195' // From a valid Twilio number
        })
            .then((message) => {
                console.log(message.sid)

            });
        res.status(201).json({ otp: otp })
    }


})

// router.put('/sendsmsAdmin', async (req, res) => {

//     const randNo = Math.floor(1000 + Math.random() * 9000)
//     const otp = randNo;
//     const adminExists = await Admin.findOne({ phone: req.body.phone })

//     if (adminExists) {

//         res.status(400).json({ error: "Phone number already used" })

//     } else {
//         const client = require('twilio')(accountSid, authToken);

//         await client.messages.create({
//             body: `Welcome to Local Shopping! \n Thank you for registering for Admin Account. Your OTP is ${otp}`,
//             to: '+91' + req.body.phone,  // Text this number
//             from: '+14806669195' // From a valid Twilio number
//         })
//             .then((message) => {
//                 console.log(message.sid)

//             });
//         res.status(201).json({ otp: otp })
//     }


// })

router.put('/sendmailUser', async (req, res) => {

    const otp = Math.floor(1000 + Math.random() * 9000)

    const adminExists = await User.findOne({ email: req.body.email })

    if (adminExists) {
        res.status(400).json({ error: "Email number already used" })
    } else {
        var mailOptions = {
            from: 'hunnurjirao2000@gmail.com',
            to: req.body.email,
            subject: 'Local Shopping-Verification key',
            text: `Welcome to Local Shopping! \n Thank you for registering for User Account. The verificatin key is ${otp}`
        }
        transporter.sendMail(mailOptions)
        res.status(201).json({ otp: otp })
    }


})

router.put('/sendmailAdmin', async (req, res) => {

    const otp = Math.floor(1000 + Math.random() * 9000)

    const adminExists = await Admin.findOne({ email: req.body.email })

    if (adminExists) {
        res.status(400).json({ error: "Email number already used" })
    } else {
        var mailOptions = {
            from: 'hunnurjirao2000@gmail.com',
            to: req.body.email,
            subject: 'Local Shopping-Verification key',
            text: `Welcome to Local Shopping! \n Thank you for registering for Admin Account. The verificatin key is ${otp}`
        }
        transporter.sendMail(mailOptions)
        res.status(201).json({ otp: otp })
    }


})

module.exports = router