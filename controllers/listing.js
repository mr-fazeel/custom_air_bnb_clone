const Listing = require('../models/listing.js');

const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};
        
        // If category is provided, filter by category
        if (category) {
            query.category = category;
        }
        
        // If search term is provided, search in title, location, country, and keywords
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } },
                { country: { $regex: search, $options: 'i' } },
                { keywords: { $regex: search, $options: 'i' } }
            ];
        }
        
        const allListings = await Listing.find(query);
        res.render("listings/index.ejs", { allListings, category, search });
    } catch (error) {
        console.error("Error fetching listings:", error);
        req.flash("error", "Failed to fetch listings");
        res.redirect("/");
    }
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
}

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: 'author' } }).populate('owner');
    if (!listing) {
        req.flash("error", "The Page You Requested For Doesn't Exist")
        return res.redirect("/listings")
    }
    res.render("listings/show.ejs", { listing })
}

module.exports.createListing = async (req, res, next) => {

    let responce = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
    })
        .send()

    let url = req.file.path;
    let filename = req.file.filename;

    const newListing = new Listing(req.body.listing); // name as object that's why direct obj name
    
    // Process keywords if they exist
    if (req.body.listing.keywords) {
        // Split by comma and trim whitespace
        newListing.keywords = req.body.listing.keywords
            .split(',')
            .map(keyword => keyword.trim())
            .filter(keyword => keyword.length > 0);
    }
    
    newListing.owner = req.user._id;
    newListing.image = { url, filename }

    newListing.geometry = responce.body.features[0].geometry; // Use the actual coordinates from Mapbox

    let savedListing = await newListing.save();
    console.log(savedListing);

    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "The page you requested for doesn't exist")
        res.redirect("/listings")
    }

    let orignalImageUrl = listing.image.url;
    orignalImageUrl = orignalImageUrl.replace('/upload', '/upload/,w_250,q_30'); // manupilate URL 
    res.render("listings/edit.ejs", { listing, orignalImageUrl });

}

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;

    // Process keywords if they exist
    if (req.body.listing.keywords) {
        req.body.listing.keywords = req.body.listing.keywords
            .split(',')
            .map(keyword => keyword.trim())
            .filter(keyword => keyword.length > 0);
    }

    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }); // deconstructing listing obj. 

    if (typeof req.file !== "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "New Listing Deleted!");
    res.redirect("/listings")
}

