const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    products:[{
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref: 'Product'
    }],
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

schema.statics.searchByName = async function(userId, productName) {
    try {
        // Match documents based on userId
        const favorites = await this.aggregate([
            {
                $match: {
                    userId: mongoose.Types.ObjectId(userId)
                }
            },
            {
                $lookup: {
                    from: 'products', // Name of the Product collection
                    localField: 'products',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            {
                $unwind: '$productDetails'
            },
            {
                $match: {
                    'productDetails.name': {
                        $regex: productName,
                        $options: 'i' // Case-insensitive
                    }
                }
            },
            {
                $group: {
                    _id: '$_id',
                    userId: { $first: '$userId' },
                    products: { $push: '$productDetails._id' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' }
                }
            }
        ]);

        return favorites;
    } catch (error) {
        throw error;
    }
};




const model = new mongoose.model("Favorite", schema);

module.exports = model;