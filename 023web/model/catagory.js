const mongoose=require("mongoose")
const Adminschema=new mongoose.Schema({
    catname:{
        type:String
    }
})
module.exports=new mongoose.model("catagory",Adminschema)