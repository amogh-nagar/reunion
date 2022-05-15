require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const postRoutes = require("./routes/posts-routes");
const routes = require("./routes/user-routes");
const HttpError = require("./models/http-error");

const app = express();

const helmet = require("helmet");
const compression = require("compression");
app.use(helmet());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  next();
});
app.get("/", (req, res) => {
  res.send("hello from server");
});
app.use("/api", routes);
app.use("/api/post", postRoutes);
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

mongoose
  .connect(process.env.mongodb)
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log("Server Connected!");
    });
  })
  .catch((err) => {
    console.log(err);
  });
