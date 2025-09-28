require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./db/connectDB");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const stockRoutes = require("./routes/stockRoute");
const styleRoutes = require("./routes/styleRoute");
const userRoutes = require("./routes/userRoute");
const relationShipRoutes = require("./routes/meterAndkgRelationShip.routes.js");
const fabricAverageRoutes = require("./routes/fabricAvg.routes.js")

const discountRoutes = require("./routes/discount.routes.js");
const app = express();

const PORT = process.env.PORT || 5000;

// global middlewares 
app.use(express.json({ limit: "50mb" }));
// app.use(cors({
//   origin: "http://localhost:5173" || "*",
//   credentials: true
// }
// ));

app.use(cors());

app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "50mb" }))



// route middlewares setting
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/stock", stockRoutes);
app.use("/api/v1/style-details", styleRoutes);
app.use("/api/v1/relation", relationShipRoutes);
app.use("/api/v1/average", fabricAverageRoutes);

// order notifier mail 



// discount routes
app.use("/api/v1/discount", discountRoutes);

app.use(globalErrorHandler)

// start server 
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`The server is running on ${PORT} number.`)
  })
})




