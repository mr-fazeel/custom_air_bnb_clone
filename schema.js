const Joi = require("joi");

module.exports.listingSchema = Joi.object({
    listing: Joi.object({
        title: Joi.string().required(),
        description: Joi.string().required(),
        location: Joi.string().required(),
        price: Joi.number().min(0).required(),
        country: Joi.string().required(),
        category: Joi.string().valid('Trending', 'Rooms', 'Iconic Cities', 'Mountains', 'Castles', 'Amazing pool', 'Farms', 'Arctic', 'Others'),
        keywords: Joi.string().allow("", null),
        image: Joi.string().allow("", null),
    }).required()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        comment: Joi.string().required()
    }).required(),
});