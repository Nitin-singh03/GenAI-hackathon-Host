const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/db");

mongoose.set("strictQuery", false);

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
});
