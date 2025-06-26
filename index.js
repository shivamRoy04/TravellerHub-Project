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


// Register middleware BEFORE routes
app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true })); // 🛠️ FIX
app.use(express.static(path.join(__dirname, "/public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine("ejs", ejsMate);


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



//listing check
// app.get("/listing", async (req, res) => {
//   try {
//     let sampleListing = new Listing({
//       title: "Newest villa",
//       description: "This is a newly opened modern well equipped villa",
//       price: 12000,
//       location: "Calangute, Goa",
//       country: "India"
//     });

//     await sampleListing.save();
//     console.log("Sample listing saved!");
//     res.send("Sample listing saved successfully");
//   } catch (err) {
//     console.error("Error saving listing:", err);
//     res.status(500).send("Error saving listing");
//   }
// });
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

app.get("/listings" ,wrapAsync( async(req,res)=>{
  let allListings = await Listing.find({});
  res.render("./listings/index.ejs",{allListings});
}));
//new form
app.get("/listing/new",(req,res)=>{
  res.render("./listings/new.ejs");
});

//show route

app.get("/listing/:id",wrapAsync(async(req,res)=>{
  let {id} = req.params;
  const item = await Listing.findById(id).populate("reviews");
  console.log(item.reviews);
  res.render("./listings/show.ejs",{item});
}));
//post req
app.post("/listing",validateListing,wrapAsync(async(req,res)=>{
     
          const newListing = new Listing(req.body.listing);
          await newListing.save();
         res.redirect("/listings");
}));




//edit route
app.get("/listing/:id/edit",wrapAsync(async(req,res)=>{
  let {id} = req.params;
  const item = await Listing.findById(id);
  res.render("./listings/edit.ejs",{item});

}));
//update route
app.put("/listing/:id/edit",validateListing,wrapAsync( async(req,res)=>{
         let {id} = req.params;
        await Listing.findByIdAndUpdate(id,{...req.body.listing});
          res.redirect(`/listing/${id}`);
}));
//delete route

app.delete("/listing/:id",wrapAsync(async(req,res)=>{
  let {id} = req.params;
  const deltedListing = await Listing.findByIdAndDelete(id);
  console.log(deltedListing);
  res.redirect("/listings");
}));
//Review Route
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

// Catch-all route for undefined paths
app.use( (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Global error-handling middleware
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  res.status(statusCode).render("./listings/error.ejs",{message});
});