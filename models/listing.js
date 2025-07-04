const mongoose = require("mongoose");
let Schema = mongoose.Schema;
const Review = require("./review.js");

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
      type: String
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
  },
  category: {
    type: String,
    enum: ["rooms", "iconic cities", "mountains", "castle", "pool", "beaches", "farms", "arctic"],
    required: false
  },
  reviews: [{
    type: Schema.Types.ObjectId,
    ref: "Reviews"
  }],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
});

ListingSchema.post("findOneAndDelete", async function (listing) {
  if (listing && listing.reviews.length) {
    await Review.deleteMany({ _id: { $in: listing.reviews } });
  }
});

const Listing = mongoose.model("Listing", ListingSchema);
module.exports = Listing;
