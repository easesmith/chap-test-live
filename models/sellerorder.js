const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new mongoose.Schema({
    userOrderId:{
        type: Schema.Types.ObjectId,
        ref:'Order',
        required:true,
    },
    nurseryId: {
        type: Schema.Types.ObjectId,
        ref:'Nursery',
        required: true,
    },
    products:[{
        type:{
          type:String,
        },
        productId:{
          type: Schema.Types.ObjectId,
          ref: 'Product'
        },
        quantity:{
          type: String,
        }
    }],
    totalPrice: {
        type: String,
        required: true,
    },
    orderStatus:{
      type:String,
      default:"placed"
    }
},{timestamps:true});


const model = new mongoose.model('SellerOrder', schema);

module.exports = model;