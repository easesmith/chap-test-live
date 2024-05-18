const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    title:{
        type: String,
        required: true,
    },
    type:{
        
        type: String,
        required: true,
    },
    value:{
        type: String,
        required: true
    },

    section:{
        type: String, 
    },

    description:{
        type: String, 
    }
}, {
    timestamps: true
});


const model = new mongoose.model("content", schema);

module.exports = model;