const userModel = require("../models/userModel")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const mongoose = require('mongoose')


const isValid = function (value) {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    if (typeof value === 'Number' && value.trim().length === 0) return false
    return true
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

let validateEmail = function (Email) {
    return /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(Email);
}


let validatephone = function (phone) {
    return /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone)
}

let validateString = function (value) {
    return /^\S*$/.test(value)
}


const createUser = async (req, res) => {
    try {
        const query = req.query
        // console.log(query)
        if (Object.keys(query) != 0) {
            return res.status(400).send({ status: false, message: "Invalid params present in URL" })
        }

        //Checking if no data is present in our request body
        let data = req.body
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please enter your details to register" })
        }

        //Checking if user has entered these mandatory fields or not
        const { fname, lname, email, profileImage, phone, password, address } = data
        const { shipping, billing } = address

        if (!isValid(fname)) {
            return res.status(400).send({ status: false, message: "fname is required" })
        }

        if (!(/^[A-Za-z\s]+$/).test(fname)) {
            return res.status(400).send({ status: false, message: "Please mention valid firstName" })
        }

        if (!validateString(fname)) {
            return res.status(400).send({ status: false, message: "Spaces are not allowed in fname" })
        }

        if (!isValid(lname)) {
            return res.status(400).send({ status: false, message: "lname is required" })
        }

        if (!(/^[A-Za-z\s]+$/).test(lname)) {
            return res.status(400).send({ status: false, message: "Please mention valid lastname" })
        }

        if (!validateString(lname)) {
            return res.status(400).send({ status: false, message: "Spaces are not allowed in lname" })
        }

        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "Email is required" })
        }

        //Checking if user entered a valid email or not

        if (!validateEmail(email)) {
            return res.status(400).send({ status: false, message: "Please enter a valid email" })
        }

        //Checking if email is unique or not
        let uniqueEmail = await userModel.findOne({ email: email })
        if (uniqueEmail) {
            return res.status(404).send({ status: false, message: "Email already exists" })
        }

        if (!isValid(profileImage)) {
            return res.status(400).send({ status: false, message: "profileImage is required" })
        }

        // if (!s3UrlExist(profileImage)) {
        //     return res.status(400).send({ status: false, message: "profileImage link is not valid s3 link" })
        // }

        if (!isValid(phone)) {
            return res.status(400).send({ status: false, message: "phone is required" })
        }

        //Checking if user entered a valid phone or not

        if (!validatephone(phone)) {
            return res.status(400).send({ status: false, message: "Please enter a valid phone" })
        }

        //Checking if phone is unique or not
        let uniquephone = await userModel.findOne({ phone: phone })
        if (uniquephone) {
            return res.status(404).send({ status: false, message: "phone already exists" })
        }

        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "Password is required" })
        }
        //Checking if password contains 8-15 characters or not
        if (password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, message: "The length of password should be in between 8-15 characters" })
        }

        if (!validateString(password)) {
            return res.status(400).send({ status: false, message: "Spaces are not allowed in password" })
        }

        // Hashing the passwords
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        data.password = hashedPassword

        //const {street,city,pincode }=shipping
        if (!isValid(shipping)) {
            return res.status(400).send({ status: false, message: "shipping data is required" })
        }

        if (!isValid(shipping.street)) {
            return res.status(400).send({ status: false, message: "Street is required" })
        }
        if (!isValid(shipping.city)) {
            return res.status(400).send({ status: false, message: "city is required" })
        }
        if (!isValid(shipping.pincode)) {
            return res.status(400).send({ status: false, message: "pincode is required" })
        }

        if (!/^[0-9]+$/.test(shipping.pincode)) {
            return res.status(400).send({ status: false, message: "Please only enter numeric characters for pincode" })
        }

        if (!isValid(billing)) {
            return res.status(400).send({ status: false, message: "Billing data is required" })
        }

        if (!isValid(billing.street)) {
            return res.status(400).send({ status: false, message: "Street is required" })
        }
        if (!isValid(billing.city)) {
            return res.status(400).send({ status: false, message: "city is required" })
        }
        if (!isValid(billing.pincode)) {
            return res.status(400).send({ status: false, message: "pincode is required" })
        }
        if (!/^[0-9]+$/.test(billing.pincode)) {
            return res.status(400).send({ status: false, message: "Please only enter numeric characters for pincode" })
        }


        //If all these validations passed , registering a user
        let UserData = await userModel.create(data)
        return res.status(201).send({ status: true, message: "You're registered successfully", data: UserData })
    }

    //Exceptional error handling
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })
    }
}



const loginUser = async (req, res) => {
    try {
        const query = req.query
       // console.log(query)
        if (Object.keys(query) != 0) {
            return res.status(400).send({ status: false, message: "Invalid params present in URL" })
        }

        //Checking if no data is present in our request
        let data = req.body
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please enter your details to login" })
        }

        //Checking if user has entered these mandatory fields or not
        const { email, password } = data

        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "Email is required" })
        }

        if (!validateEmail(email)) {
            return res.status(400).send({ status: false, message: "Please enter a valid email" })
        }


        if (!isValid(password)) {
            return res.status(400).send({ status: false, message: "Password is required" })
        }

        //Matching that email  with a user document in our UserModel
        const userMatch = await userModel.findOne({ email: email })
        if (!userMatch) {
            return res.status(401).send({ status: false, message: "Invalid Email address" })
        }
        // make a comparison between entered password and the database password
        const validUserPassword = await bcrypt.compare(
            password,
            userMatch.password
        );
        if (!validUserPassword) {
            return res.status(401).send({ status: false, message:"Invalid password"});
        }

        //Creating a token if email and password matches
        const token = jwt.sign({
            userId: userMatch._id,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (10 * 60 * 60)
        }, "Secret-Key-given-by-us-to-secure-our-token")

        //Setting back that token in header of response
        //res.setHeader("x-api-key", token);

        //Sending response on successfull login
        return res.status(200).send({
            status: true, message: "You are successfully logged in",
            data: {
                userId: token.userId,
                token: token
            }
        })

    }
    //Exceptional error handling
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })
    }
}


const getProfile=async function(req,res){
    try{
        let userId=req.params.userId
        let userIdFromToken=req.userId
       if(!userId) {return res.status(400).send({ status: false, message:"userid required"})}

       if(!isValidObjectId(userId)){
        return res.status(400).send({ status: false, message:"UserId not a valid ObjectId"})
       }

       let userData=await userModel.findById(userId)
       if(!userData){
        return res.status(404).send({ status: false, message:"User not present in the collection"})
       }
      
       if(userId!=userIdFromToken){
        return res.status(403).send({ status: false, message:"User is not Authorized"}) 
       }

       let getUserDetails=await userModel.find({_id:userId})
       return res.status(200).send({status:true,message:"User profile details",data:getUserDetails})
       
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })
    }
}



const updateProfile=async function(req,res){
    try{
        let userId=req.params.userId
        let userIdFromToken=req.userId
       if(!userId) {return res.status(400).send({ status: false, message:"userid required"})}

       if(!isValidObjectId(userId)){
        return res.status(400).send({ status: false, message:"UserId not a valid ObjectId"})
       }

       let userData=await userModel.findById(userId)
       if(!userData){
        return res.status(404).send({ status: false, message:"User not present in the collection"})
       }
      
       if(userId!=userIdFromToken){
        return res.status(403).send({ status: false, message:"User is not Authorized"}) 
       }

       const {  fname, lname, email, profileImage, phone, password, address } = data
        let updatedData = {}
        if (!isValidRequestBody(data)) { return res.status(400).send({ status: false, message: "Enter valid parameters" }) }

        if (fname) {
            if (!isValid(fname)) {
                return res.status(400).send({ status: false, msg: "title is not in valid format" })
            }
            let dupTitle = await bookModel.findOne({ title })
            if (dupTitle) {
                return res.status(400).send({ status: false, message: "Title already present" })
            }
            updatedData['title'] = title
        }

        let updatedDetails=await userModel.findByIdAndUpdate(userId,{ $set: updatedData },{new:true})
        return res.status(200).send({status:true,message:"User profile updated",data:updatedDetails})

    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })
    }
}



module.exports = { createUser, loginUser,getProfile,updateProfile }