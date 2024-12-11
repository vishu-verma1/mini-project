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

app.get("/profile", isLogedIn, async (req, res) => {
  //isLogedIn is a middleware that will check if user is loged in or not

  let user = await userModel
    .findOne({ email: req.user.email })
    .populate("posts"); // finding user in db and populating posts array
  // console.log(user);

  res.render("profile", { user }); // sending user data to profile page
});
app.get("/like/:id", isLogedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");

  if (post.likes.indexOf(req.user.userid) === -1) {
    post.likes.push(req.user.userid);
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userid), 1); // removing user id from likes array
  }

  await post.save();
  res.redirect("/profile");
});

app.get("/edit/:id", isLogedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate("user");
  res.render("edit", { post });
});

app.post("/update/:id", isLogedIn, async (req, res) => {
  let post= await postModel.findOneAndUpdate(
    {_id: req.params.id}, 
    { content: req.body.content }
  ); // finding user in db and updating content
  res.redirect("/profile");
});

app.post("/post", isLogedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email }); // finding user in db
  let { content } = req.body; // destructring content from req.body
  let post = await postModel.create({
    user: user._id,
    content: content,
  });

  user.posts.push(post._id); // pushing post id in user posts array
  user.save(); // saving user data
  res.redirect("/profile"); // redirecting to profile page
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
      res.status(200).redirect("/profile");
    } else res.redirect("/login");
  });
});

app.get("/logout", (req, res) => {
  res.cookie("token", ""); // removing token from the browser
  res.redirect("/login"); //and redirecing to login page
});

function isLogedIn(req, res, next) {
  if (req.cookies.token === "") res.redirect("/login");
  else {
    let data = jwt.verify(req.cookies.token, "secretkey");
    req.user = data;
    next();
  }
}

app.listen(3000);
