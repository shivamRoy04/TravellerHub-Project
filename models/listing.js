const mongoose = require("mongoose");
let Schema = mongoose.Schema;

const ListingSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    filename: String,
    url: {
      type: String,
      default: "https://unsplash.com/photos/red-and-black-house-near-bushes-4IP7MzmYGOU"
    }
  },
  price: {
    type: Number,
    required: true
  },
  location: {
    type: String,
  },
  country: {
    type: String
  }
});

const Listing = mongoose.model("Listing", ListingSchema);
module.exports = Listing;
