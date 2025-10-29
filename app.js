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
const fabricRateRoutes = require("./routes/fabricRate.routes.js");
const discountRoutes = require("./routes/discount.routes.js");
const orderidMappedRoutes = require("./routes/mappedOrderWithStyleNumber.routes.js");
const stock2Routes = require("./routes/stock2.routes.js");
const app = express();

const PORT = process.env.PORT || 5000;

// global middlewares 
app.use(express.json({ limit: "50mb" }));
app.use(cors());

app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "50mb" }))



// route middlewares setting
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/stock", stockRoutes);
app.use("/api/v1/style-details", styleRoutes);
app.use("/api/v1/relation", relationShipRoutes);
app.use("/api/v1/average", fabricAverageRoutes);

app.use("/api/v1/stock2", stock2Routes);

app.use("/api/v1/fabric-rate", fabricRateRoutes);

// order id mapping styles route
app.use("/api/v1/order-id-mapping", orderidMappedRoutes)



// discount routes
app.use("/api/v1/discount", discountRoutes);

app.use(globalErrorHandler)

// start server 
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`The server is running on ${PORT} number.`)
  })
})




