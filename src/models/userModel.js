const mongoose = require('mongoose')



const userSchema = new mongoose.Schema({ 
    fname: {
        type: String, 
        required: true
    },
    lname: {
        type: String, 
        required: true
    },
    email: {
        type: String, 
        required: true,
        unique: true
    },
    profileImage: {
        type: String,
        required: true
    }, // s3 link
    phone: {
        type: String, 
        required: true,
        unique: true
    }, 
    password: {
        type: String, 
        required: true,
        minLen: 8,
        maxLen: 15
    }, // encrypted password
    address: {
      shipping: {
        street: {
            type: String, 
            required: true
        },
        city: {
            type: String, 
            required: true
        },
        pincode: {
            type: Number, 
            rqeuired: true
        }
      },
      billing: {
        street: {
            type: String, 
            required: true
        },
        city: {
            type: String, 
            required: true
        },
        pincode: {
            type: Number, 
            rqeuired: true
        }
    }
  }
}, { timestamps: true });

//creating a model from schema and export it 
module.exports = mongoose.model('user', userSchema)

