const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const app = express()

dotenv.config({ path: './config.env' })

const port = process.env.PORT || 5000;
app.use(express.json())
require('./db/conn')

app.use(require('./router/auth'))
app.use(cookieParser());



app.listen(port, () => {
    console.log(`Listening to the port ${port}`);
})

