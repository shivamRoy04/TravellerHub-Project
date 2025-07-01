const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

let url = 'mongodb://127.0.0.1:27017/TravellerHub';

async function main() {
  await mongoose.connect(url);
}
main()
  .then(() => {
    console.log("Connected successfully to MongoDB");
  })
  .catch((err) => console.log(err));

const initDb = async () => {
  try {
    await Listing.deleteMany({});
    console.log("Old listings deleted.");

    const listingsWithOwner = initData.map((obj) => ({
      ...obj,
      owner: '686150cbeb9884850a0dc080',
    }));

    await Listing.insertMany(listingsWithOwner);
    console.log("DATA was initialized successfully.");
  } catch (err) {
    console.error("Error during DB initialization:", err);
  }
};

initDb();
