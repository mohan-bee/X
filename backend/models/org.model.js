const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const organisationSchema = new Schema({
  name: { 
    type: String, 
    required: [true, 'Organisation name is required'] 
  },
  turfName: { 
    type: String, 
    required: [true, 'Turf name is required'] 
  },
  approved: { 
    type: Boolean, 
    default: false 
  },
  mobile: [{ 
    type: Number, 
    required: [true, 'At least one mobile number is required'] 
  }],
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'] 
  },
  address1: String,
  address2: String,
  state: String,
  district: String,
  pincode: Number,
  description: String,
  images: [String],
  ratings: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5
  },
  slots: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Slot' 
  }],
  feedbacks: [{
    read: { type: Boolean, default: false },
    content: String,
    createdAt: { type: Date, default: Date.now }
  }],
  reports: [{
    read: { type: Boolean, default: false },
    content: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, 
{ 
  timestamps: true 
});


const Organisation = mongoose.model('Organisation', organisationSchema);

module.exports = Organisation;