import express from 'express'
import 'dotenv/config'

const app = express()

app.use(express.json())

app.listen(3000, () => console.log('🚀 Server running'))
