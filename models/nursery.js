const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const nurserySchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    address: {
        state: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        addressLine: {
            type: String,
        },
        pincode: {
            type: String,
        },
    },
    password: {
        type: String,
        // required: true,
    },
    contactPerson:[ {
        contactName: {
            type: String,
            required: true,
        },
        contactPhone: {
            type: String,
            required: true,
        },
        contactEmail: {
            type: String,
            required: true,
        },
    }],
    status:{
        type: String,
        default: "inactive"
    },
    location:{
        type:{
            type: String,
            default: 'Point'
        },
        coordinates:{
            type: [Number],

        }
    }
}, { timestamps: true });

nurserySchema.index({ location: '2dsphere' });


module.exports = mongoose.model("Nursery", nurserySchema);
