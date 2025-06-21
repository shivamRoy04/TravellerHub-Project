const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");
let url = 'mongodb://127.0.0.1:27017/TravellerHub';


async function main() {
  await mongoose.connect(url);
}
main().then(()=>{console.log("connected succesfully")}).catch(err => console.log(err));
const initDb = async()=>{
    await Listing.deleteMany({});
     await Listing.insertMany(initData.data);
     console.log("DATA was initialized");
}
initDb();