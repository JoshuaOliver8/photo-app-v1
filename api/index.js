require('dotenv').config()
const express = require('express')
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const datauriParser = require('datauri/parser')
const parser = new datauriParser()
const path = require('path')
const cors = require('cors')
const axios = require('axios')
const mongoose = require('mongoose')
const loginRouter = require('./controllers/login')
const tagsRouter = require('./controllers/tags')
const usersRouter = require('./controllers/users')

const app = express()

app.use(express.json())
app.use(cors())
app.use(express.static('dist'))

const MONGODB_URL = process.env.MONGODB_URI

mongoose.set('strictQuery', false)
mongoose.connect(MONGODB_URL, { dbName: "photoApp" })

const BASE_URL = `https://api.cloudinary.com/v1_1/${process.env.CLOUD_NAME}`
const auth = {
    username: process.env.API_KEY,
    password: process.env.API_SECRET
}

const arrayOfAllowedFiles = [
    "png",
    "jpeg",
    "jpg",
    "gif",
    "heic",
    "heif",
    "tiff",
    "tif",
    "webp",
    "jfif",
]

app.use('/api/login', loginRouter)
app.use('/api/tags', tagsRouter)
/*
FOR TESTING
app.use('/api/signup', usersRouter)
*/

app.get('/photos', async (req, res, next) => {
    const response = await axios.get(BASE_URL + '/resources/image', {
        auth,
        params: {
            next_cursor: req.query.next_cursor
        },
    }).catch(error => next(error))

    return res.send(response.data)
})

app.get('/search', async (req, res, next) => {
    const response = await axios.get(BASE_URL + '/resources/search', {
        auth,
        params: {
            expression: req.query.expression,
            max_results: req.query.max_results,
            next_cursor: req.query.next_cursor
        }
    }).catch(error => next(error))

    return res.send(response.data)
})

app.post('/upload', upload.single('file'), async (req, res, next) => {
    try {
        const fileExtension = req.file.originalname.slice(
            ((req.file.originalname.lastIndexOf('.') - 1) >>> 0) + 2
        )

        if (!arrayOfAllowedFiles.includes(fileExtension)) {
            throw Error('invalid file')
        }

        const extName = path.extname(req.file.originalname).toString()
        const file64 = parser.format(extName, req.file.buffer)
        const formData = new FormData()
        
        formData.append("file", file64.content)
        formData.append("upload_preset", "photo-app")
        formData.append("tags", req.body.tags)
        
        const response = await axios.post(BASE_URL + '/image/upload', formData)
        
        return res.send(response.data)
    } catch (err) {
        next(err)
    }
})

const unknownEndpoint = (req, res) => {
    res.status(404).send({ error: "unknown endpoint" })
}

app.use(unknownEndpoint)

const errorHandler = (error, req, res, next) => {
    console.error(error.message)

    if(error.message === "invalid file") {
        return res.status(400).send({ error: "invalid file for upload"})
    } else if (error.message.startsWith("E11000 duplicate key error collection")) {
        return res.status(400).send({ error: "duplicate tag"})
    }

    next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT || 3001

app.listen(PORT, console.log(`Server running on port ${PORT}`))