const mongoose=require("mongoose")

const adminSchema=new mongoose.Schema({
   userName:{
     type:String,
     required:true
   },
   password:{
    type:String,
    required:true
   },
   permissions:{
    dashboard: { type: String, enum: ['read', 'write', 'none'],required:true },

    nurseries: { type: String, enum: ['read', 'write', 'none'],required:true },

    services: { type: String, enum: ['read', 'write', 'none'],required:true },

    members: { type: String, enum: ['read', 'write', 'none'],required:true },

    testimonals: { type: String, enum: ['read', 'write', 'none'],required:true },

    website: { type: String, enum: ['read', 'write', 'none'],required:true },

    complaints: { type: String, enum: ['read', 'write', 'none'],required:true },

    disputes: { type: String, enum: ['read', 'write', 'none'],required:true },

    settings: { type: String, enum: ['read', 'write', 'none'],required:true },

    orders: { type: String, enum: ['read', 'write', 'none'],required:true },
    
    availableIn: { type: String, enum: ['read', 'write', 'none'],required:true },

   },

   status:{
     type: String,
     default:'active'
   }
},{timestamps:true})

module.exports=mongoose.model("Admin",adminSchema)