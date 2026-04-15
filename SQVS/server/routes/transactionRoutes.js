const express = require('express')
const router = express.Router()
const transactionController = require('../controllers/transactionController')

// Public for demo / Admin restricted in a real app
router.post('/reset', transactionController.resetDatabase)
router.post('/scenario/1', transactionController.runScenario1)
router.post('/scenario/2', transactionController.runScenario2)
router.post('/scenario/3', transactionController.runScenario3)
router.post('/scenario/4', transactionController.runScenario4)
router.post('/scenario/5', transactionController.runScenario5)

module.exports = router
