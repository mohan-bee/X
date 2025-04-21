const express = require('express')
const router = express.Router()
const orgController = require('../controllers/org.controller')
const { protect, authorize, ownsOrganisation, adminOnly, allowFeedback } = require('../middleware/auth.middleware')

router.post('/create', orgController.createOrganisation)
router.post('/login', orgController.loginOrganisation)

router.get('/', protect, authorize('admin'), orgController.getAllOrganisations)
router.get('/:id', protect, authorize('admin', 'organisation'), orgController.getOrganisationById)

router.patch('/:id', protect, ownsOrganisation, orgController.updateOrganisation)

router.delete('/:id', protect, adminOnly, orgController.deleteOrganisation)
router.patch('/:id/approve', protect, adminOnly, orgController.toggleApproval)

router.post('/:id/feedback', protect, allowFeedback, orgController.addFeedback)
router.post('/:id/report', protect, allowFeedback, orgController.addReport)

module.exports = router
