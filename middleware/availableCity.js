const availableCitiesModel=require("../models/availableCities")

exports.isCityAvailable=async(req,res,next)=>{
    try{          
        const { city } = req.body
             const result = await availableCitiesModel.findOne({ city: city })
             if(result!==null){
               next()
             }else{
                     res.status(400).json({success:false,message:"product is not available in your city"})
             }   
    }catch(err){
        res.status(400).json({success:false,message:"verify city middleware error"})
    }
}