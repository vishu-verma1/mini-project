const express = require("express");
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  // creating index endpoint page (or rout)
  res.render("index");
});

app.get("/login", (req, res) => {
  // login rout that will show login ejs page
  res.render("login");
});

app.get("/profile", isLogedIn, (req, res) => {
  console.log(req.user);
  res.render("login")
});

app.post("/register", async (req, res) => {
  let { email, username, name, age, password } = req.body; // destructring data into variables
  let existedUser = await userModel.findOne({ email }); // finding user in DB
  if (existedUser) return res.status(500).send("User already registerd"); // if user exist send user already regidterd

  // making password hash with bcypt pkg

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      // console.log(hash);
      let user = await userModel.create({
        // creating new user and storing in db
        username,
        name,
        age,
        password: hash,
        email,
      });

      // sending token as a cookie to browser
      let token = jwt.sign({ email: email, userid: user._id }, "secretkey");
      res.cookie("token", token);
      res.send("registerd"); // sending msg that u registerd successfully (u can also send flash msgs)
    });
  });
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let existedUser = await userModel.findOne({ email });

  if (!existedUser) return res.status(500).send("Somting went wrong"); // if user is not registerd
  bcrypt.compare(password, existedUser.password, (err, result) => {
    if (result) {
      let token = jwt.sign(
        { email: email, userid: existedUser._id },
        "secretkey"
      );
      res.cookie("token", token);
      res.status(200).send("you can login");
    } else res.redirect("/login");
  });
});

app.get("/logout", (req, res) => {
  res.cookie("token", ""); // removing token from the browser
  res.redirect("/login"); //and redirecing to login page
});

function isLogedIn(req, res, next) {
  if (req.cookies.token === "") res.send("You must be logged in");
  else {
    let data = jwt.verify(req.cookies.token, "secretkey");
    req.user = data;
    next();
  }

}

app.listen(3000);
