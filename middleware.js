const Listing = require("./models/listing");
const Review = require("./models/review.js"); 

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in first");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
};

module.exports.isOwner = async(req,res,next)=>{
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if(!listing.owner.equals(res.locals.curUser._id)){
        req.flash("error", "You don't have permission to edit");
        return res.redirect(`/listing/${id}`); 
    }
    next();
};

module.exports.isAuthor = async(req,res,next)=>{
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);  
    if(!review.author.equals(res.locals.curUser._id)){
        req.flash("error", "You didn't create this review");
        return res.redirect(`/listing/${id}`); 
    }
    next();
};
