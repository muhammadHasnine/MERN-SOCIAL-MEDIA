const mongoose = require("mongoose");
const dotenv = require("dotenv");
// // Config
// dotenv.config({ path: "backend/config/config.env" });
exports.connectDB = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then((con) => console.log(`Database connected: ${con.connection.host}`))
    .catch((err) => console.log(err));
};
