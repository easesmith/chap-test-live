const mongoose=require("mongoose")

const availableCitiesSchema=new mongoose.Schema({
     state:{
        type:String,
        require:true
     },
     city:{
        type:String,
        require:true
     }
},{timestamps:true})

module.exports=mongoose.model("availebleCities",availableCitiesSchema)