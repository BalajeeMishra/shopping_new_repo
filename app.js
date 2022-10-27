if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongo");
const flash = require("connect-flash");
const AppError = require("./controlError/AppError");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");

const Categories = require("./routes/admin_categories");
const Pages = require("./routes/pages");
const Product = require("./routes/admin_product");
const Users = require("./routes/user");
const admin_pages = require("./routes/admin_pages");
const Userproduct = require("./routes/product");
const payment = require("./routes/payment");
// const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/shoppingcart";
const dbUrl =
  "mongodb+srv://Balajee:J3IwOazuLn6lBghe@cluster0.rfqls.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("connection open");
  })
  .catch((err) => {
    console.log(err);
  });

const app = express();
console.log(Date.now());

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname + "/public"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const store = new MongoDBStore({
  mongoUrl: dbUrl,
  secret: "thisshouldbeabettersecret!",
  touchAfter: 60,
});

store.on("error", function (e) {
  console.log("SESSION STORE ERROR", e);
});

const sessionConfig = {
  store,
  secret: "thisshouldbeabettersecret!",
  resave: true,
  name: "balajee",
  saveUninitialized: true, //because of true here we are able to see cookies with every request.
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 20,
    maxAge: 1000 * 20,
  },
};

app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

//routes part.
app.use("/admin/products", Product);
app.use("/admin/pages", admin_pages);
app.use("/admin/categories", Categories);
app.use("/users", Users);
app.use("/", Pages);
app.use("/product", Userproduct);
app.use("/", payment);

const handleValidationErr = (err) => {
  return new AppError("please fill up all the required field carefully", 400);
};

app.use((err, req, res, next) => {
  //We can single out particular types of Mongoose Errors:
  if (err.name === "ValidationError") err = handleValidationErr(err);
  next(err);
});

app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  if (err) {
    res.status(statusCode).render("error", { err });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("APP IS LISTENING ON PORT");
});
