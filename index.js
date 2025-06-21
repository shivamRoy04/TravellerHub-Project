const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
app.use(methodOverride("_method"));
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

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


app.get("/listings" , async(req,res)=>{
  let allListings = await Listing.find({});
  res.render("./listings/index.ejs",{allListings});
});
//new form
app.get("/listing/new",(req,res)=>{
  res.render("./listings/new.ejs");
});

//show route
app.use(express.urlencoded({extended:true}));
app.get("/listing/:id",async(req,res)=>{
  let {id} = req.params;
  const item = await Listing.findById(id);
  res.render("./listings/show.ejs",{item});
});
//post req
app.post("/listing",async(req,res)=>{
         const newListing = new Listing(req.body.listing);
         await newListing.save();
         res.redirect("/listings");
});
//edit route
app.get("/listing/:id/edit",async(req,res)=>{
  let {id} = req.params;
  const item = await Listing.findById(id);
  res.render("./listings/edit.ejs",{item});

});
//update route
app.put("/listing/:id/edit", async(req,res)=>{
         let {id} = req.params;
        await Listing.findByIdAndUpdate(id,{...req.body.listing});
          res.redirect(`/listing/${id}`);
});
//delete route

app.delete("/listing/:id",async(req,res)=>{
  let {id} = req.params;
  const deltedListing = await Listing.findByIdAndDelete(id);
  console.log(deltedListing);
  res.redirect("/listings");
});