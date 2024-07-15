const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const userModel = require("./models/user");
const postModel = require("./models/posts");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { log } = require("console");
const app = express();
const port = process.env.PORT || 3000;
const upload = require('./config/multerconfig')

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));



app.get("/", (req, res) => {
  res.render("index");
});

app.get("/profile/upload", (req, res) => {
  res.render("test");
});

app.post("/upload", isLogin,upload.single('file'),async (req, res) => {
  const user = await userModel.findOneAndUpdate({email: req.user.email}, {profilepic: req.file.filename})
  res.redirect('/profile');
});


app.get("/register", (req, res) => {
  console.log(req.body);
  res.render("register");
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/");
});

app.get("/login", (req, res) => {
  // console.log(req.body);
  res.render("login");
});

app.get("/profile", isLogin, async (req, res) => {
  // console.log(req.cookies);

  const user = await userModel
    .findOne({ email: req.user.email })
    .populate("posts");
  res.render("profile", { user });
});

app.get("/like/:id", isLogin, async (req, res) => {
  const post = await postModel.findOne({ _id: req.params.id }).populate("user");
  const cuser = await userModel.findOne({ email: req.user.email });
  console.log(post);
  const user = post.likes.indexOf(cuser._id);
  if (user === -1) {
    post.likes.push(cuser._id);
  } else {
    post.likes.splice(user, 1);
  }
  await post.save();
  res.redirect("/profile");
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  // res.send({username, email, password})
  const user = await userModel.findOne({ email }); //remeber this is async
  if (user) {
    return res.redirect("/login");
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const newuser = await userModel.create({
    username,
    email,
    password: hash,
  });
  let token = jwt.sign({ email, username }, "shh");
  res.cookie("token", token); //remeber the arguments taken by cookie
  // console.log(newuser);
  res.redirect("/login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  // res.send({username, email, password})
  const user = await userModel.findOne({ email }); //remeber this is async
  if (!user) {
    return res.redirect("/register");
  }
  await bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign({ email, username: user.username }, "shh");
      res.cookie("token", token);
      return res.redirect("/profile");
    }
  });
  // console.log(newuser);
});

app.post("/create-post", isLogin, async (req, res) => {
  let currentUser = await userModel.findOne({ email: req.user.email });
  let post = await postModel.create({
    user: currentUser._id,
    content: req.body.postContent,
  });

  currentUser.posts.push(post._id);
  await currentUser.save();
  console.log(currentUser);
  res.redirect("profile");
});

function isLogin(req, res, next) {
  let token = req.cookies.token;
  if (!token) {
    return res.redirect("/login");
  }
  let data = jwt.verify(token, "shh");
  req.user = data;
  // console.log(user);
  next();
}

app.listen(port, () => {
  console.log("Server is running on http://localhost:" + port);
});
