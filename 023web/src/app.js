const express=require("express")
const app=express()
const mongoose=require("mongoose")
const hbs=require("hbs")
const dotenv=require("dotenv")
dotenv.config()
const port=5000
const url= "mongodb+srv://jinal:jinal123@cluster0.kg20vuu.mongodb.net/project?retryWrites=true&w=majority"

const path=require("path")

const viewpath=path.join(__dirname,"../templates/views")
app.set("views",viewpath)
app.set("view engine","hbs")
const publicpath=path.join(__dirname,"../public")
app.use(express.static(publicpath))
const partialpath=path.join(__dirname,"../templates/partials")
hbs.registerPartials(partialpath)
const bodyparser=require("body-parser")
app.use(bodyparser.urlencoded({extended:false}))
const cookieparser=require("cookie-parser")
app.use(cookieparser())
mongoose.connect(url).then(()=>{
    console.log("db conected");
})

const userrouter=require("../router/userrouter")
app.use("/",userrouter)
const adminrouter=require("../router/adminrouter")
app.use("/",adminrouter)
app.listen(port,(req,resp)=>{
    console.log("server runing on port"+port);
})