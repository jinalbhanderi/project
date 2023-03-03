const express = require("express")
const router = express.Router()
const catagory = require("../model/catagory")
const product = require("../model/product")
const multer = require("multer")
router.get("/dashboard", (req, resp) => {
    resp.render("dashboard")
})

router.get("/login", (req, resp) => {
    resp.render("login")
})
router.get("/register", (req, resp) => {
    resp.render("register")
})
router.get("/calendar", (req, resp) => {
    resp.render("calendar")
})
router.get("/profile", (req, resp) => {
    resp.render("profile")
})
// ***********************************catagory***********************************
router.get("/catagory", async (req, resp) => {
    try {
        const cat = await catagory.find()
        resp.render("catagory", { cdata: cat })

    } catch (error) {

    }
})

router.post("/addcatagory", async (req, resp) => {
    try {
        const data = new catagory(req.body)
        await data.save()
        resp.redirect("catagory")
    } catch (error) {
        console.log(error);
    }

})
router.get("/deletecat", async (req, resp) => {
    const id = req.query.did
    try {
        await catagory.findByIdAndDelete(id)
        resp.redirect("catagory")
    } catch (error) {
        console.log(error);
    }
})
router.get("/editcat", async (req, resp) => {
    const id = req.query.uid
    try {
        const data = await catagory.findOne({ _id: id })
        resp.render()
    } catch (error) {

    }
})

// ************************************product*********************************

router.get("/product", async(req, resp) => {
    try {
        const cat=await catagory.find()
        const pro = await product.find()
        resp.render("product",{cdata:cat, pdata:pro})
        

    } catch (error) {
        
    }
})

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/productimg")
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + ".jpg")
    }
})
const upload = multer({ storage: storage })
router.post("/adproduct", upload.single("file"), async (req, resp) => {
    try {
        const pro = new product({
            cid: req.body.cid,
            pname: req.body.pname,
            price: req.body.price,
            qty: req.body.qty,
            imgname: req.file.filename
        })
        await pro.save()
        resp.redirect("product")
    } catch (error) {
        console.log(error);
    }
})

router.get("/deletepro",async(req,resp)=>{
    const id=req.query.did
    try {
        await product.findByIdAndDelete(id)
        resp.redirect("product")
    } catch (error) {
        console.log(error);
    }
})
module.exports = router