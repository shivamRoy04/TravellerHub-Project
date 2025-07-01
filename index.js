require('dotenv').config();
console.log("DEBUG: After dotenv load - CLOUD_NAME:", process.env.CLOUD_NAME);
console.log("DEBUG: After dotenv load - CLOUD_API_KEY:", process.env.CLOUD_API_KEY);
console.log("DEBUG: After dotenv load - CLOUD_API_SECRET:", process.env.CLOUD_API_SECRET);
const fs = require('fs');




const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const {storage} = require("./cloudconfig.js")
const multer = require("multer");


const Listing = require("./models/listing.js");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const Review = require("./models/review.js");
const {listingSchema,reviewSchema} = require("./schema.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/users.js");
const {isLoggedIn, saveRedirectUrl, isOwner, isAuthor} = require("./middleware.js");
const upload = multer({storage});


// Register middleware BEFORE routes
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true })); // 🛠️ FIX
app.use(express.static(path.join(__dirname, "/public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);


const dbUrl = process.env.ATLASDB_URL;

async function main() {
  await mongoose.connect(dbUrl);
}
main().then(()=>{console.log("connected succesfully")}).catch(err => console.log(err));


const store = MongoStore.create({
  mongoUrl:dbUrl,
  crypto:{
    secret:"mysecret"
  },
  touchAfter : 24*60*60,
});
store.on("error",()=>{
  console.log("Error in mongo session store",err);
});


let sessionoptions = {
  store,
  secret:"mysecret",
  resave:false,
  saveUninitialized:true,
};


app.use(session(sessionoptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
//authentication of user through local strategy
passport.use(new LocalStrategy(User.authenticate()));


//serializing and deserializing user
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser())

app.listen(8080,()=>{
    console.log("listening at port 8080");
});

//let url = 'mongodb://127.0.0.1:27017/TravellerHub';


app.use((req, res, next) => {
   res.locals.success = req.flash("success");
   res.locals.error = req.flash("error");
   res.locals.curUser = req.user; 
   next(); 
});



const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    const errmsg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, errmsg);
  }
  next();
};

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const errmsg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, errmsg);
  }
  next();
};


//index page
app.get("/listings", wrapAsync(async (req, res) => {
  let { category, search } = req.query;
  let allListings;

  const queryObj = {};

  if (category) {
    queryObj.category = category.toLowerCase();
  }

  if (search) {
    queryObj.$or = [
      { title: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } }
    ];
  }

  allListings = await Listing.find(queryObj);

  console.log("DEBUG filter:", category || "All", "Search:", search || "None");
  console.log("Listings returned:", allListings.length);

  res.render("./listings/index.ejs", { allListings, category });
}));




//new form
app.get("/listing/new",isLoggedIn,(req,res)=>{
  res.render("./listings/new.ejs");
});

//show route

app.get("/listing/:id",wrapAsync(async(req,res)=>{
  let {id} = req.params;
  const item = await Listing.findById(id).populate({path: "reviews",populate: { path:"author",}}).populate("owner");
 
  res.render("./listings/show.ejs",{item});
}));


//post req

app.post("/listing", isLoggedIn, upload.single("listing[image]"), (req, res, next) => {
    if (req.file) {
        req.body.listing.image = req.file.path;
    }
    next();
}, validateListing, wrapAsync(async (req, res) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {
        url: req.file.path,
        filename: req.file.filename
    };
    await newListing.save();
    req.flash("success", "New Listing Created");
    res.redirect("/listings");
}));


//edit route
app.get("/listing/:id/edit",isLoggedIn,isOwner,wrapAsync(async(req,res)=>{
  let {id} = req.params;
  const item = await Listing.findById(id);
  res.render("./listings/edit.ejs",{item});

}));
//update route
app.put("/listing/:id/edit", isLoggedIn, upload.single("listing[image]"), wrapAsync(async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);

  // 👇 Handle image
  if (req.file) {
    req.body.listing.image = {
      url: req.file.path,
      filename: req.file.filename
    };
  } else {
    // 🧠 Use existing image from DB if no new one uploaded
    req.body.listing.image = listing.image;
  }

  // ✅ Validate with pre-filled image
  const { error } = listingSchema.validate(req.body);
  if (error) {
    throw new ExpressError(400, error.details.map(e => e.message).join(", "));
  }

  // ✅ Update listing
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  req.flash("success", "Listing updated successfully");
  res.redirect(`/listing/${id}`);
}));



//delete route

app.delete("/listing/:id",isLoggedIn,isOwner,wrapAsync(async(req,res)=>{
  let {id} = req.params;
  const deltedListing = await Listing.findByIdAndDelete(id);
  console.log(deltedListing);
  req.flash("success","Listing was delted");
  res.redirect("/listings");
}));


// //Review Route
 //Post request for the review
 app.post("/listing/:id/review",validateReview,wrapAsync(async(req,res)=>{
      let listing =  await Listing.findById(req.params.id);
      let newReview = new Review (req.body.review);
        newReview.author = req.user._id;
      listing.reviews.push(newReview);
      await newReview.save();
      await listing.save();
      console.log("new review saved");
      res.redirect(`/listing/${listing._id}`);

 }));


 //delete review route
 app.delete("/listing/:id/review/:reviewId",isLoggedIn,isAuthor,wrapAsync(async(req,res)=>{
        let {id,reviewId} = req.params;
        await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
        await Review.findByIdAndDelete(reviewId);
        res.redirect(`/listing/${id}`);
 }));





 //new sign up
 app.get("/signup",(req,res)=>{
  res.render("./user/signup.ejs");
 });

 //post 
 app.post("/signup",wrapAsync(async(req,res)=>{
            let{username,email,password }= req.body;
            const newUser = new User({email,username});
           let registeredUser = await User.register(newUser,password);
           console.log(registeredUser);
           req.login(registeredUser,(err)=>{
            if(err){
              return next(err);
            }
             req.flash("success","Welcome to our site");
           res.redirect("/listings");
           });
          
 }));

//login
app.get("/login",(req,res)=>{
   res.render("./user/login.ejs");
});

//post login
app.post("/login", saveRedirectUrl,
    passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }),
    (req, res) => {
        req.flash("success", "You're logged in now");
        const redirectUrl = res.locals.redirectUrl || "/listings";
        delete req.session.redirectUrl; //  clear after use
        res.redirect(redirectUrl);
    }
);

//logout
app.get("/logout",(req,res,next)=>{
  req.logout((err)=>{
    if(err){
      return next(err);
    }
    req.flash("err","You were logged out");
    res.redirect("/listings"); 
  })
});

app.get("/", (req, res) => {
  res.redirect("/listings");
});

// Catch-all route for undefined paths
app.use( (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Global error-handling middleware
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("./listings/error.ejs",{message});
});