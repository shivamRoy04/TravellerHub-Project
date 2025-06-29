const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");

const Listing = require("./models/listing.js");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const Review = require("./models/review.js");
const {listingSchema,reviewSchema} = require("./schema.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/users.js");
const {isLoggedIn} = require("./middleware.js");



// Register middleware BEFORE routes
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true })); // 🛠️ FIX
app.use(express.static(path.join(__dirname, "/public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);

let sessionoptions = {
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

app.get("/",(req,res)=>{
    res.send("HI im root");
});


let url = 'mongodb://127.0.0.1:27017/TravellerHub';


async function main() {
  await mongoose.connect(url);
}
main().then(()=>{console.log("connected succesfully")}).catch(err => console.log(err));

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


//fake user demo test
app.get("/demo",async(req,res)=>{
      let fakeuser = new User({
        email:"abc@gmail.com",
        username:"allhahuakbar"
      });
      let registerduser = await User.register(fakeuser,"password");
      res.send(registerduser);

});


//index page
app.get("/listings" ,wrapAsync( async(req,res)=>{
  let allListings = await Listing.find({});
  res.render("./listings/index.ejs",{allListings});
}));


//new form
app.get("/listing/new",isLoggedIn,(req,res)=>{
  res.render("./listings/new.ejs");
});

//show route

app.get("/listing/:id",wrapAsync(async(req,res)=>{
  let {id} = req.params;
  const item = await Listing.findById(id).populate("reviews");
  
  // if(!item){
  //   req.flash("error","Your requested listing doesn't exist");
  //   return res.redirect("./listings");
  // }
  res.render("./listings/show.ejs",{item});
}));


//post req
app.post("/listing",validateListing,wrapAsync(async(req,res)=>{
     
          const newListing = new Listing(req.body.listing);
          await newListing.save();
          req.flash("success","New Listing Created");
         
         res.redirect("/listings");
}));




//edit route
app.get("/listing/:id/edit",isLoggedIn,wrapAsync(async(req,res)=>{
  let {id} = req.params;
  const item = await Listing.findById(id);
  res.render("./listings/edit.ejs",{item});

}));
//update route
app.put("/listing/:id/edit",isLoggedIn,validateListing,wrapAsync( async(req,res)=>{
         let {id} = req.params;
        await Listing.findByIdAndUpdate(id,{...req.body.listing});
        
          res.redirect(`/listing/${id}`);
}));
//delete route

app.delete("/listing/:id",isLoggedIn,wrapAsync(async(req,res)=>{
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

      listing.reviews.push(newReview);
      await newReview.save();
      await listing.save();
      console.log("new review saved");
      res.redirect(`/listing/${listing._id}`);

 }));


 //delete review route
 app.delete("/listing/:id/review/:reviewId",wrapAsync(async(req,res)=>{
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
app.post("/login",
  passport.authenticate("local",{failureRedirect:"/login", failureFlash:true}),
  async(req,res)=>{
    req.flash("success","You're logged in now");
    res.redirect("/listings");

});
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



// Catch-all route for undefined paths
app.use( (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Global error-handling middleware
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("./listings/error.ejs",{message});
});