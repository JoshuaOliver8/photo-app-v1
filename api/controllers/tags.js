const tagsRouter = require('express').Router()
const Tag = require('../models/tag')

tagsRouter.get('/', (req, res) => {
    Tag.find({}).then(tags => {
        res.json(tags)
    })
})

tagsRouter.post('/', (req, res, next) => {
    const body = req.body

    const tag = new Tag({
        tagName: body.tagName,
        descriptiveName: body.descriptiveName
    })

    tag.save()
        .then(savedTag => {
            res.json(savedTag)
        })
        .catch(error => {
            next(error)
        })
})

module.exports = tagsRouter