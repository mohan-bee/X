const Organisation = require('../models/org.model')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

exports.createOrganisation = async (req, res) => {
  try {
    const { 
      name, turfName, mobile, email, password, 
      address1, address2, state, district, pincode, description, images 
    } = req.body

    const existingOrg = await Organisation.findOne({ email })
    if (existingOrg) {
      return res.status(400).json({ 
        success: false, 
        message: 'Organisation with this email already exists' 
      })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const newOrganisation = new Organisation({
      name,
      turfName,
      mobile,
      email,
      password: hashedPassword,
      address1,
      address2,
      state,
      district,
      pincode,
      description,
      images: images || [],
      approved: false
    })

    const savedOrganisation = await newOrganisation.save()
    
    res.status(201).json({
      success: true,
      message: 'Organisation created successfully. Pending approval.',
      data: savedOrganisation
    })
  } catch (error) {
    console.error('Error creating organisation:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create organisation',
      error: error.message
    })
  }
}

exports.loginOrganisation = async (req, res) => {
  try {
    const { email, password } = req.body

    const organisation = await Organisation.findOne({ email })
    if (!organisation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Organisation not found' 
      })
    }

    if (!organisation.approved) {
      return res.status(403).json({
        success: false,
        message: 'Your organisation is pending approval'
      })
    }

    const isPasswordValid = await bcrypt.compare(password, organisation.password)
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    const token = jwt.sign(
      { id: organisation._id, email: organisation.email },
      process.env.JWT_SECRET || 'mONU',
      { expiresIn: '24h' }
    )

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: organisation._id,
        name: organisation.name,
        email: organisation.email,
        turfName: organisation.turfName,
        approved: organisation.approved
      }
    })
  } catch (error) {
    console.error('Error logging in:', error)
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    })
  }
}

exports.getAllOrganisations = async (req, res) => {
  try {
    const filter = {}
    
    if (req.query.approved !== undefined) {
      filter.approved = req.query.approved === 'true'
    }

    const organisations = await Organisation.find(filter)
      .select('-password')
      .populate('slots')

    res.status(200).json({
      success: true,
      count: organisations.length,
      data: organisations
    })
  } catch (error) {
    console.error('Error getting organisations:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve organisations',
      error: error.message
    })
  }
}

exports.getOrganisationById = async (req, res) => {
  try {
    const organisation = await Organisation.findById(req.params.id)
      .select('-password')
      .populate('slots')

    if (!organisation) {
      return res.status(404).json({
        success: false,
        message: 'Organisation not found'
      })
    }

    res.status(200).json({
      success: true,
      data: organisation
    })
  } catch (error) {
    console.error('Error getting organisation:', error)
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid organisation ID'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve organisation',
      error: error.message
    })
  }
}

exports.updateOrganisation = async (req, res) => {
  try {
    const { password, email, approved, ...updateData } = req.body
    
    const organisation = await Organisation.findById(req.params.id)
    if (!organisation) {
      return res.status(404).json({
        success: false,
        message: 'Organisation not found'
      })
    }

    if (email && email !== organisation.email) {
      const emailExists = await Organisation.findOne({ email })
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        })
      }
      updateData.email = email
    }

    if (password) {
      const salt = await bcrypt.genSalt(10)
      updateData.password = await bcrypt.hash(password, salt)
    }

    if (req.body.images) {
      updateData.images = req.body.images
    }

    const updatedOrganisation = await Organisation.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password')

    res.status(200).json({
      success: true,
      message: 'Organisation updated successfully',
      data: updatedOrganisation
    })
  } catch (error) {
    console.error('Error updating organisation:', error)
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid organisation ID'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update organisation',
      error: error.message
    })
  }
}

exports.deleteOrganisation = async (req, res) => {
  try {
    const organisation = await Organisation.findById(req.params.id)
    
    if (!organisation) {
      return res.status(404).json({
        success: false,
        message: 'Organisation not found'
      })
    }

    await Organisation.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Organisation deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting organisation:', error)
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid organisation ID'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete organisation',
      error: error.message
    })
  }
}

exports.toggleApproval = async (req, res) => {
  try {
    const organisation = await Organisation.findById(req.params.id)
    
    if (!organisation) {
      return res.status(404).json({
        success: false,
        message: 'Organisation not found'
      })
    }

    organisation.approved = !organisation.approved
    await organisation.save()

    res.status(200).json({
      success: true,
      message: `Organisation ${organisation.approved ? 'approved' : 'unapproved'} successfully`,
      data: {
        id: organisation._id,
        name: organisation.name,
        approved: organisation.approved
      }
    })
  } catch (error) {
    console.error('Error toggling approval:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update approval status',
      error: error.message
    })
  }
}

exports.addFeedback = async (req, res) => {
  try {
    const { content } = req.body
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Feedback content is required'
      })
    }

    const organisation = await Organisation.findById(req.params.id)
    
    if (!organisation) {
      return res.status(404).json({
        success: false,
        message: 'Organisation not found'
      })
    }

    organisation.feedbacks.push({
      content,
      read: false,
      createdAt: Date.now()
    })

    await organisation.save()

    res.status(201).json({
      success: true,
      message: 'Feedback added successfully',
      data: organisation.feedbacks[organisation.feedbacks.length - 1]
    })
  } catch (error) {
    console.error('Error adding feedback:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add feedback',
      error: error.message
    })
  }
}

exports.addReport = async (req, res) => {
  try {
    const { content } = req.body
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Report content is required'
      })
    }

    const organisation = await Organisation.findById(req.params.id)
    
    if (!organisation) {
      return res.status(404).json({
        success: false,
        message: 'Organisation not found'
      })
    }

    organisation.reports.push({
      content,
      read: false,
      createdAt: Date.now()
    })

    await organisation.save()

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: organisation.reports[organisation.reports.length - 1]
    })
  } catch (error) {
    console.error('Error adding report:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to submit report',
      error: error.message
    })
  }
}
