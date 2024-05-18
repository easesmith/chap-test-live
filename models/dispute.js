const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
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
        unique:true,
    },
    assignee:{
        type:String,
        required:true,
    },
    description:{
        type:String,
    },

    orderId: {
        type:String
    },
    
    sellerId:{
        type: mongoose.Types.ObjectId,
        ref:'Nursery',
        required:true
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

module.exports=mongoose.model('Dispute', disputeSchema);

