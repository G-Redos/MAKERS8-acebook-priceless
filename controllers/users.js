const User = require("../models/user");
const { body, validationResult } = require("express-validator");

const UsersController = {
  Index: (req, res) => {
    const userID = req.params.id;
    User.findById(userID)
      .populate("friends")
      .then((user) => {
        const hasFriends = user.friends.length > 0;
        const isLoggedIn = req.session.user != null;
        const isFriends =
          req.session.user != null
            ? user.friends.some((friend) => friend._id == req.session.user._id)
            : false;
        const isPending =
          req.session.user != null
            ? user.friendRequests.includes(req.session.user._id)
            : false;
        const isNotOwnProfile =
          req.session.user != null
            ? req.session.user._id != req.params.id
            : false;
        res.render("users/index", {
          user: user,
          isLoggedIn: isLoggedIn,
          isFriends: isFriends,
          hasFriends: hasFriends,
          isPending: isPending,
          isNotOwnProfile: isNotOwnProfile,
        });
      })
      .catch(() => {
        res.render("error", { message: "This user does not exist" });
      });
  },

  New: (req, res) => {
    res.render("users/new", {});
  },

  Create: (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).render("users/new", {
        message: errors.array()[0].msg,
      });
    }

    const user = new User(req.body);
    user.save((err) => {
      if (err) {
        if (err.name === "MongoError" && err.code === 11000) {
          // Duplicate email
          return res.render("users/new", {
            message: "A user with this email already exists",
          });
        }
      }
      res.status(201).redirect("/posts");
    });
  },

  Validate: (method) => {
    switch (method) {
      case "Create": {
        return [
          body(
            "name",
            "Error: Name should not include numbers or special characters, other than '-' and spaces. Try again!"
          )
            .exists()
            // todo: allow accented characters
            .isAlpha("en-US", { ignore: " -" }),
          body("email", "Error: Invalid email, you dummy. Try again!")
            .exists()
            .isEmail(),
          // todo: fine tune how we want passwords to be...
          body(
            "password",
            "Error: Password does not meet requirements. Try again!"
          )
            .exists()
            .isLength({ min: 5 }),
        ];
      }
    }
  },
};

module.exports = UsersController;
