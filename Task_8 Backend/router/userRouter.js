const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authenticate = require("../middlewares/authenticate");

/*
    @usage : to Register a User
    @url : /api/users/register
    @fields : name , email , password
    @method : POST
    @access : PUBLIC
 */
router.post("/register", async (request, response) => {
  try {
    let { name, email, password } = request.body;
    // check if the user exits
    let user = await User.findOne({ email: email });

    if (user) {
      return response.status(201).json({ msg: "User already Exists" });
    }

    /* This code is generating a salt using `bcrypt.genSalt()` method with a cost factor of 10, and
        then using that salt to hash the password using `bcrypt.hash()` method. Salting and hashing
        the password is a common technique used to securely store passwords in a database. The salt
        is a random string that is added to the password before hashing, which makes it more
        difficult for attackers to crack the password using techniques like rainbow tables. The
        resulting hash is then stored in the database instead of the plain text password. */

    let salt = await bcrypt.genSalt(10); // salt is actually encrypted password
    password = await bcrypt.hash(password, salt); //password=salt

    let avatar =
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTTOkHm3_mPQ5PPRvGtU6Si7FJg8DVDtZ47rw&usqp=CAU";

    user = new User({ name, email, password, avatar });
    await user.save();
    response.status(200).json({ msg: "Registration is Successful" });
  } catch (error) {
    console.error(error);
    response.status(500).json({ errors: [{ msg: error.message }] });
  }
});

/*
    @usage : to Login a User
    @url : /api/users/login
    @fields : email , password
    @method : POST
    @access : PUBLIC
 */
router.post(
  "/login",

  async (request, response) => {
    try {
      let { email, password } = request.body;

      // check if the correct email
      let user = await User.findOne({ email: email });

      if (!user) {
        return response
          .status(201)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      // check the passwords
      let isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return response
          .status(201)
          .json({ errors: [{ msg: "Invalid Credentials" }] });
      }

      // create a token and send to Client
      /* This code is creating a JSON Web Token (JWT) for the authenticated user and sending it back to the
client as a response to the login request. */
      let payload = {
        user: {
          id: user.id,
          name: user.name,
        },
      };
      /* This code is creating a JSON Web Token (JWT) for the authenticated user and sending it back to the client as a response to the login request. The `jwt.sign()` method takes in a payload
      object, a secret key, and a callback function. The payload object contains the user
      information that will be encoded in the token. The secret key is used to sign the token and
      verify its authenticity. The callback function is called with an error object and the token
      string. If there is an error, it will be thrown, otherwise, the token will be sent back to the
      client as a response to the login request. */
      jwt.sign(payload, "adityaisagoodboy", (error, token) => {
        if (error) throw error;
        response.status(200).json({
          msg: "Login is Success",
          token: token,
        });
      });
    } catch (error) {
      console.error(error);
      response.status(500).json({ errors: [{ msg: error.message }] });
    }
  }
);

/*
    @usage :  to get user Info
    @url : /api/users/me
    @fields : no-fields
    @method : GET
    @access : PRIVATE
 */
router.get("/me", authenticate, async (request, response) => {
  try {
    let user = await User.findById(request.user.id).select("-password");
    response.status(200).json({
      user: user,
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({ errors: [{ msg: error.message }] });
  }
});

router.post("/addFollower", authenticate, async (req, res) => {
  try {
    let follower_user = await User.findById(req.body.follower_user_id);
    let followed_user = await User.findById(req.body.followed_user_id);
    follower_user.followings.push(followed_user._id);
    followed_user.followers.push(follower_user._id);
    followed_user = await followed_user.save();
    follower_user = await follower_user.save();
    res.status(200).json({
      followed_user,
      follower_user,
    });
  } catch (error) {
    console.log(error);
    res.status(408).json({ errors: "Adding follower failed" });
  }
});

router.post("/removeFollower", authenticate, async (req, res) => {
  try {
    let follower_user = await User.findById(req.body.follower_user_id);
    let followed_user = await User.findById(req.body.followed_user_id);
    const followed_index = follower_user.followings.indexOf(followed_user._id);
    const follower_index = followed_user.followers.indexOf(follower_user._id);
    follower_user.followings.splice(followed_index,1);
    followed_user.followers.splice(follower_index,1);
    followed_user = await followed_user.save();
    follower_user = await follower_user.save();
    res.status(200).json({
      followed_user,
      follower_user,
    });
  } catch (error) {
    console.log(error);
    res.status(408).json({ errors: "Adding follower failed" });
  }
});

module.exports = router;
