require("isomorphic-fetch");
require("dotenv").config();
const express = require("express");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const session = require("express-session");

const api = require("./routes/api");

const app = express();

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  cookie: { secure: process.env.SESSION_COOKIE_SECURE === "true" },
  resave: false,
  saveUninitialized: false,
  secret: process.env.APP_SECRET
}));

app.use("/api", api);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, _) {
  console.error(err.message);
  res.status(err.status || 500).json({error: err.message});
});

module.exports = app;
