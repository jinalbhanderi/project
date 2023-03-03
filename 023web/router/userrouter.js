const express = require("express")
const router = express.Router()
const product = require("../model/product")
const catagory = require("../model/catagory")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const User = require("../model/user")
const uauth = require("../middleware/userauth")
const Cart = require("../model/cart")
const Order = require("../model/order")
const Razorpay = require('razorpay');
const nodemailer = require("nodemailer")



router.get("/", async (req, resp) => {
    try {
        const cat = await catagory.find()
        const pro = await product.find()
        resp.render("index", { cdata: cat, pdata: pro })
    } catch (error) {
        console.log(error);
    }

})
router.get("/shop", async (req, resp) => {
    try {
        const cat = await catagory.find()
        const pro = await product.find()
        resp.render("shop", { cdata: cat, pdata: pro })
    } catch (error) {
        console.log(error);
    }

})


// *****************************************user**************************************
router.get("/reg", (req, resp) => {
    resp.render("userregister")
})
router.post("/reg", async (req, resp) => {
    try {
        const data = new User(req.body)
        await data.save()
        resp.render("userregister", { "msg": "registration successfully" })
    } catch (error) {
        console.log(error);
    }
})
router.get("/login", (req, resp) => {
    resp.render("userlogin")
})
router.post("/login", async (req, resp) => {
    try {
        const user = await User.findOne({ email: req.body.email })
        const valid = await bcrypt.compare(req.body.password, user.password)
        if (valid) {
            const token = await user.generatetoken()
            resp.cookie("jwt", token)
            resp.render("index")

        }
        else {
            resp.render("userlogin", { msg: "invalid email or password" })
        }
    } catch (error) {
        resp.render("userlogin", { msg: "invalid email or password" })

    }
})
router.get("/logout", uauth, async (req, resp) => {
    try {
        const user = req.user
        const token = req.token
        user.Tokens = user.Tokens.filter(ele => {
            return ele.token != token
        })
        await user.save()
        resp.clearCookie("jwt")
        resp.render("userlogin")

    } catch (error) {
        console.log(error);
    }
})
// ********************************cart*************************

router.get("/cart", uauth, async (req, resp) => {
    const uid = req.user._id
    try {
        const cartd = await Cart.aggregate([{ $match: { uid: uid } }, { $lookup: { from: 'products', localField: 'pid', foreignField: '_id', as: 'products' } }])
        // console.log(cartdata);
        let sum = 0
        for (let i = 0; i < cartd.length; i++) {
            sum = sum + cartd[i].total

        }
        // console.log(sum);
        resp.render("cart", { cartdata: cartd, carttotal: sum })
    } catch (error) {
        console.log(error);
    }

})

router.get("/findbycat", uauth, async (req, resp) => {
    const catid = req.query.catid
    try {
        const cat = await catagory.find()
        const pro = await product.find({ cid: catid })
        resp.render("shop", { cdata: cat, pdata: pro })
    } catch (error) {
        console.log(error);
    }
})

router.get("/addtocart", uauth, async (req, resp) => {
    pid = req.query.pid
    uid = req.user._id
    // console.log(pid);
    // console.log(uid);
    try {
        const allcartproduct = await Cart.find({ uid: uid })
        const productdata = await product.findOne({ _id: pid })
        const duplicate = await allcartproduct.find(ele => {
            return ele.pid == pid
        })
        if (duplicate) {
            resp.send("product already exits");
        }
        else {
            const cart = new Cart({
                pid: pid,
                uid: uid,
                total: productdata.price
            })
            await cart.save()
            resp.send("ok")
        }
    } catch (error) {
        console.log(error);
    }

})
router.get("/removecart", uauth, async (req, resp) => {
    const cartid = req.query.cartid
    try {
        await Cart.findByIdAndDelete(cartid)
        resp.send("product remove from the cart")
    } catch (error) {
        console.log(error);
    }
})

router.get("/changeqty", uauth, async (req, resp) => {
    try {
        const cartid = req.query.cartid
        const cartproduct = await Cart.findOne({ _id: cartid })
        // console.log(cartproduct);
        const productdata = await product.findOne({ _id: cartproduct.pid })
        const newqty = Number(cartproduct.qty) + Number(req.query.qty)
        if (newqty < 1 || newqty > productdata.qty) {
            return
        }
        const newtotal = newqty * productdata.price
        await Cart.findByIdAndUpdate(cartid, { qty: newqty, total: newtotal })
        resp.send("ok")
    } catch (error) {
        console.log(error);
        resp.send(error)
    }
})


router.get("/payment", (req, resp) => {
    const amt = Number(req.query.amt)
    console.log(amt);
    var instance = new Razorpay({ key_id: "rzp_test_WOONFY9u511Byr", key_secret: 't9ROVnSqZbzNZr59d3KLWzJO' })

    var options = {
        amount: amt * 100,  // amount in the smallest currency unit
        currency: "INR",
        receipt: "order_rcptid_11"
    };
    instance.orders.create(options, function (err, order) {
        resp.send(order)
    });
})

var transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: 'jinalsangani123@gmail.com',
        pass: 'waczukesxmmoixzw'
    }
});


router.get("/order", uauth, async (req, resp) => {
    const pid = req.query.pid
    const user = req.user
    cartproduct = await Cart.find({ uid: user._id })
    var prod = []
    for (let i = 0; i < cartproduct.length; i++) {
        prod[i] = {
            pid: cartproduct[i].pid,
            qty: cartproduct[i].qty
        }

    }
    // console.log(prod);
    try {
        const or = new Order({
            pid: pid,
            uid: user._id,
            product: prod
        })
        const orderdata = await or.save()
        var row = ""
        for (let i = 0; i < prod.length; i++) {
            const Product = await product.findOne({ _id: prod[i].pid })
            row = row + "<span>" + Product.pname + " " + Product.price + " " + prod[i].qty + "</span><br>"

        }
        console.log(row);
        var msg = {
            from: "jinalsangani123@gmail.com",
            to: user.email,
            subject: "Order conformation",
            html: "<h1>E shop</h1>paymentid :<span>" + pid + "</span><br><span>" + orderdata._id + "</span><br><span>" + user.fname + " " + user.lname + "<br>ph no:" + user.phno + "</span><br>"+row

        }
        transporter.sendMail(msg, (err, success) => {
            if (err) {
                console.log(err);
                return
            }
            resp.send("ypur order is confirmed ")
        })


        resp.send("your order confirmed")
    } catch (error) {

    }
})


module.exports = router