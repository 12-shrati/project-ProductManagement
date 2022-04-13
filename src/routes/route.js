const express = require('express');
const router = express.Router();
const userController = require("../controllers/userController.js");
const productController=require('../controllers/productController')
const middleware = require('../middleware/auth')



//User
router.post("/register", userController.createUser);   //CreateUser

router.post("/login", userController.loginUser);   //LoginUser

router.get("/user/:userId/profile", middleware.authenticateUser, userController.getProfile);      //getProfile

router.put("/user/:userId/profile", middleware.authenticateUser, userController.updateProfile);    //updateProfile

//-------------------------------------------------------------------------------------------------------------------------

//Product
router.post("/products", productController.createProduct); 

router.get("/products", productController.getProductsByfilter);

router.get("/products/:productId", productController.getProductsById);

router.put("/products/:productId", productController.updatedProducts);

router.delete("/products/:productId", productController.deleteProducts);


module.exports = router;