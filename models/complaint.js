const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    issue:{
        type:String,
        required:true
    },
    issueType:{
        type:String,
        required: true,
    },
    ticketNumber:{
        type:String,
        required:true,
        unique:true,
    },
    assignee:{
        type:String,
        required:true,
    },
    description:{
        type:String,
    },
    image:{
        type:String,
    },
    orderId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Order'
    },
    productId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Product'
    },
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    replies:[{
        reply:{
            type:String,
        },
        repliedBy:{
            type:String
        }
    }],
    status:{
        type:String,
        default:"opened"
    }
}, {timestamps:true});


// we can also add resolved by field = > admin, nursery

const model = new mongoose.model('complaint', schema);

module.exports = model;