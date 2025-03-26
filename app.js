if (process.env.NODE_ENV != "production") {
    require('dotenv').config();
}
// console.log(process.env.SECRET); console.log(process.env) // remove this after you've confirmed it is working

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require("path");
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utils/ExpressError.js');
const session = require('express-session');
const MongoStore = require('connect-mongo'); // for production
const flash = require('connect-flash');
const passport = require("passport");
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');

const listingRouter = require("./routes/listing.js")
const reviewRouter = require("./routes/review.js")
const userRouter = require("./routes/user.js")

const MONGO_URL = 'mongodb://127.0.0.1:27017/wonderlust';
// const dbUrl = process.env.ATLASDB_URL;


main().then(() => {
    console.log("Conntected  to  DB")
}).catch(err => console.log(err));

async function main() {
    await mongoose.connect(MONGO_URL);
    // await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
    mongoUrl: MONGO_URL, // dbUrl,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.log('Error in Mongo Session Store:', err);
});

const sessionOption = {
    store, // same as store:store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in ms & in date
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
        httpOnly: true,
    }
}

app.use(session(sessionOption));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    
    // Pass search and category parameters to all views
    res.locals.search = req.query.search || '';
    res.locals.category = req.query.category || '';
    
    next()
});

// app.get("/", (req, res) => {
//     res.send("i'm working")
// });

// app.get("/demouser", async (req, res) => {
//     let fakeUser = new User({
//         email: "studemt@email.com",
//         username: "delta-student"
//     });

//     let registeredUser = await User.register(fakeUser, "helloworld");
//     res.send(registeredUser);
// });

app.use("/listings", listingRouter); //expressRouter for listings crud.
app.use("/listings/:id/reviews", reviewRouter); //expressRouter for reviews.
app.use("/", userRouter); //expressRouter for User athentication, authorization.

app.all("*", (req, res, next) => {
    next(new ExpressError(400, "Page  not found"))
});

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went wrong" } = err;
    // res.status(statusCode).send(message)
    res.status(statusCode).render("listings/error.ejs", { message });
})

app.listen(8080, () => {
    console.log("The Port is listening at 8080! ");
});