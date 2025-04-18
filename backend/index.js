require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db')
const errorHandler = require('./middleware/error.middleware')
const notFound = require('./middleware/notFound.middleaware')
const authRoutes = require('./routes/auth.route')

connectDB()

const app = express()

app.use(cors())

app.use(express.json())

app.use(cookieParser());


app.use('/api/auth', authRoutes)




app.use(notFound)
app.use(errorHandler)




const PORT = process.env.PORT || 3000



app.listen(PORT, () => {


  console.log(`Server running on port ${PORT}`)



});

