const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');


const userSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
// passp-locl-mongo... would define username and password with hash itself
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);