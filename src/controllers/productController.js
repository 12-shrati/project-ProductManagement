const productModel = require('../models/productModel')
const mongoose = require('mongoose')
let s3 = require('../s3/aws')


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


let isValidateSize = function (value) {
    return ["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(value) != -1
}


//--------------------------------------------------------------------------------------------------------------

const createProduct = async (req, res) => {
    try {

        //Checking if no data is present in our request body
        let data = req.body
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Please enter details of product" })
        }

        //Checking if user has entered these mandatory fields or not
        const { title, description, price, currencyId, currencyFormat, productImage, availableSizes, style, installments } = data

        if (!isValid(title)) {
            return res.status(400).send({ status: false, message: "title is required" })
        }
        let uniqueTitle = await productModel.findOne({ title: title })
        if (uniqueTitle) {
            return res.status(400).send({ status: false, message: "Title already exists" })
        }

        if (!isValid(description)) {
            return res.status(400).send({ status: false, message: "description is required" })
        }


        if (!isValid(price)) {
            return res.status(400).send({ status: false, message: "price is required" })
        }
        if (!/^\d+(?:\.\d{1,2})?$/.test(price)) {
            return res.status(400).send({ status: false, message: "Enter valid price" })
        }

        if (!isValid(currencyId)) {
            return res.status(400).send({ status: false, message: "currencyId is required" })
        }

        if (!isValid(currencyFormat)) {
            return res.status(400).send({ status: false, message: "currencyFormat is required" })
        }


        let files = req.files
        if (files && files.length > 0) {
            let uploadedFileURL = await s3.uploadFile(files[0])
            data['productImage'] = uploadedFileURL
        }
        else {
            return res.status(400).send({ status: false, message: "productImage is required" })
        }

        if (!isValidateSize(availableSizes)) {
            return res.status(400).send({ status: false, message: "Availablesize atleast one of the size in S, XS, M, X, L, XXL, XL" })
        }

        let productData = {
            title,
            description,
            price,
            currencyId,
            currencyFormat,
            productImage: data.productImage,
            style,
            availableSizes,
            installments
        }

        let productDetails = await productModel.create(productData)
        return res.status(201).send({ status: true, message: "Success", data: productDetails })
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })
    }
}

//---------------------------------------------------------------------------------------------------------------------

let getProductsByfilter = async function (req, res) {
    try {
        const QueryParam = req.query
        const { size, name, priceGreaterThan, priceLesserThan, priceSort } = QueryParam

        if (!isValidRequestBody(QueryParam)) {
            const productsNotDeleted = await productModel.find({ isDeleted: false }).sort({ title: 1 })
            return res.status(200).send({ status: true, data: productsNotDeleted })
        }

        const filter = { isDeleted: false }

        if (size) {
            for (let i = 0; i < size.length; i++) {
                if (["S", "XS", "M", "X", "L", "XXL", "XL"].includes(size[i])) {
                    filter['availableSizes'] = size
                }
            }
        }
        let productName = []
        if (name!=null) {
            const productTitle = await productModel.find({ isDeleted: false }).select({ title: 1, _id: 0 })
            for (let i = 0; i < productTitle.length; i++) {
                var checkTitle = productTitle[i].title

                let includeChar = checkTitle.includes(name)
                if (includeChar) 
                productName.push(checkTitle)
            
            filter['title'] = productName
            }
        }

        if (priceGreaterThan) {
            filter['price'] = { $gt: priceGreaterThan }
        }

        if (priceLesserThan) {
            filter['price'] = { $lt: priceLesserThan }
        }
        if (priceGreaterThan && priceLesserThan) {
            filter['price'] = { $gt: priceGreaterThan, $lt: priceLesserThan }
        }

        if (priceSort) {
            if (priceSort != 1 || priceSort != -1) {
                return res.status(400).send({ status: false, message: "You can sort price by using 1 and -1" })
            }
        }

            const productsData = await productModel.find(filter).sort({ price: priceSort })

            if (productsData.length == 0) {
                return res.status(400).send({ status: false, message: "No product Exist" })
            }
            return res.status(200).send({ status: true, message: 'product list', data: productsData })
        
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

//--------------------------------------------------------------------------------------------------------------------------

let getProductsById = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!productId) { return res.status(400).send({ status: false, message: "productId required" }) }

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "productId not a valid ObjectId" })
        }

        let productData = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!productData) {
            return res.status(404).send({ status: false, message: "product not present in the collection" })
        }
        if (productData.isDeleted == true) {
            return res.status(400).send({ status: false, message: "product already Deleted" })
        }


        return res.status(200).send({ status: true, message: "Product details", data: productData })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


//============================================================================================================================


const updatedProducts = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!productId) { return res.status(400).send({ status: false, message: "userid required" }) }

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "UserId not a valid ObjectId" })
        }

        let productData = await productModel.findOne({ _id: productId })
        if (!productData) {
            return res.status(404).send({ status: false, message: "product not present in the collection" })
        }

        if (productData.isDeleted == true) {
            return res.status(400).send({ status: false, message: "product already Deleted" })
        }
        let data = req.body
        const { title, description, price, currencyId, productImage, availableSizes, style, installments } = data

        let updatedData = {}
        if (!isValidRequestBody(data)) { return res.status(400).send({ status: false, message: "Enter value to be updating..." }) }

        if (isValid(title)) {
            let uniqueTitle = await productModel.findOne({ title: title })
            if (uniqueTitle) {
                return res.status(400).send({ status: false, message: "Title already exists" })
            }
            updatedData['title'] = title
        }

        if (isValid(description)) {
            updatedData['description'] = description
        }

        if (isValid(price)) {
            if (!/^\d+(?:\.\d{1,2})?$/.test(price)) {
                return res.status(400).send({ status: false, message: "Enter valid price" })
            }
            updatedData['price'] = price
        }

        if (isValid(description)) {
            updatedData['description'] = description
        }

        let files = req.files
        if (files && files.length > 0) {
            let uploadedFileURL = await s3.uploadFile(files[0])
            data['productImage'] = uploadedFileURL

            updatedData['productImage'] = data.productImage
        } else {

            updatedData['productImage'] = productData.productImage
        }

        if (isValid(currencyId)) {
            updatedData['currencyId'] = currencyId
        }

        if (isValid(availableSizes)) {
            if (!isValidateSize(availableSizes)) {
                return res.status(400).send({ status: false, message: "Availablesize atleast one of the size in S, XS, M, X, L, XXL, XL" })
            }
            updatedData['availableSizes'] = availableSizes
        }


        if (isValid(style)) {
            updatedData['style'] = style
        }

        if (isValid(installments)) {
            updatedData['installments'] = installments
        }

        let updatedDetails = await productModel.findByIdAndUpdate(productId, { $set: updatedData }, { new: true })
        return res.status(200).send({ status: true, message: "product updated", data: updatedDetails })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


//====================================================================================================================

let deleteProducts = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!productId) { return res.status(400).send({ status: false, message: "productId required" }) }

        if (!isValidObjectId(productId)) {
            return res.status(400).send({ status: false, message: "productId not a valid ObjectId" })
        }

        let productData = await productModel.findOne({ _id: productId })
        if (!productData) {
            return res.status(404).send({ status: false, message: "product not present in the collection" })
        }
        if (productData.isDeleted == true) {
            return res.status(400).send({ status: false, message: "product  already Deleted" })
        }


        let deletedProductDetails = await productModel.findByIdAndUpdate(productId, { $set: { isDeleted: true, deletedAt: Date() } }, { new: true })
        return res.status(200).send({ status: true, message: "product deleted successfully", data: deletedProductDetails })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}



module.exports = { createProduct, getProductsByfilter, getProductsById, updatedProducts, deleteProducts }