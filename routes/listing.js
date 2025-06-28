// const express = require("express");
// const router = express.Router();

// router.get("/listings" ,wrapAsync( async(req,res)=>{
//   let allListings = await Listing.find({});
//   res.render("./listings/index.ejs",{allListings});
// }));
// //new form
// router.get("/new",(req,res)=>{
//   res.render("./listings/new.ejs");
// });

// //show route

// router.get("/:id",wrapAsync(async(req,res)=>{
//   let {id} = req.params;
//   const item = await Listing.findById(id).populate("reviews");
//   console.log(item.reviews);
//   res.render("./listings/show.ejs",{item});
// }));
// //post req
// router.post("/",validateListing,wrapAsync(async(req,res)=>{
     
//           const newListing = new Listing(req.body.listing);
//           await newListing.save();
//          res.redirect("/listings");
// }));




// //edit route
// router.get("/:id/edit",wrapAsync(async(req,res)=>{
//   let {id} = req.params;
//   const item = await Listing.findById(id);
//   res.render("./listings/edit.ejs",{item});

// }));
// //update route
// router.put("/:id/edit",validateListing,wrapAsync( async(req,res)=>{
//          let {id} = req.params;
//         await Listing.findByIdAndUpdate(id,{...req.body.listing});
//           res.redirect(`/listing/${id}`);
// }));
// //delete route

// router.delete("/:id",wrapAsync(async(req,res)=>{
//   let {id} = req.params;
//   const deltedListing = await Listing.findByIdAndDelete(id);
//   console.log(deltedListing);
//   res.redirect("/listings");
// }));

// module.exports = router;