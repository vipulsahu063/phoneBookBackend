require('dotenv').config()

const express = require('express')
const app = express()
const cors = require('cors')
const morgan = require('morgan')
const Person = require('./models/note')


morgan.token('body', (req) => (
    JSON.stringify(req.body)
))

app.use(express.json())
app.use(cors())
app.use(express.static('dist'))
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

app.get('/info', (request, response, next) => {
    Person.countDocuments()
        .then(totalPerson => {
            const currentTime = new Date()
            response.send(
                `<p>Phonebook has info of ${totalPerson} persons</p><p>${currentTime}</p>`   
            )
        })
        .catch(error => next(error))
})

app.get('/api/persons', (request, response) => {
    Person.find({}).then(p => (
        response.json(p)
    ))
})

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(person => { 
            if(person) {
                response.json(person)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
})

app.post('/api/persons', (request, response) => {
    const body = request.body

    if(!body.name || !body.number) {
        return response.status(400).json({
            "error": "The name or number is missing"
        })
    }

    const person = new Person({
        name: body.name,
        number: body.number,
    })
    
    person.save().then(savedPerson => (
        response.json(savedPerson)
    ))
    .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body

    Person.findOne({name : body.name})
        .then(existingPerson => {

                Person.findByIdAndUpdate(request.params.id, {number: body.number} , {runValidators: true})
                    .then(updatedPerson => {
                        response.json(updatedPerson)
                    })
                    .catch(error => next(error))

        })
        .catch(error => next(error))

})



app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndDelete(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
    

})

const unknownEndpoint = (request, response) => {
    response.status(404).send({error: 'unknown endpoint'})
}

const errorHandler = (error, request, response, next) => {
    console.log(error.message)

    if(error === 'CastError') {
        return response.status(400).send({error: 'malformed id'})
    } else if (error === 'ValidationError') {
        return response.status(400).send({error: error.message})
    }

    next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT 

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})

