const express = require("express");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Models = require("./models.js");
const { check, oneOf, body, validationResult } = require("express-validator");

const Movies = Models.Movie;
const Users = Models.User;
const app = express();

// mongoose.connect("mongodb://127.0.0.1:27017/moviedb");
mongoose.connect(process.env.CONNECTION_URI);

// Movies.find({ "Genre.Name": "Action" })
//   .then((movies) => {
//     console.log(movies);
//   })
//   .catch((err) => {
//     console.log(err);
//   });

let accessLogStream = fs.createWriteStream(
  path.join(__dirname, "/logs/access.log"),
  { flags: "a" }
);

//Format date to be in local timezone instead of UTC
morgan.token("date", function () {
  var p = new Date()
    .toString()
    .replace(/[A-Z]{3}\+/, "+")
    .split(/ /);
  return p[2] + "/" + p[1] + "/" + p[3] + ":" + p[4] + " " + p[5];
});

function morganFormatted(tokens, req, res) {
  return [
    "New request\n",
    "-----------------------------------------------------------\n", // horizontal line breaker added with every log
    tokens["remote-addr"](req, res),
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    tokens.res(req, res, "content-length"),
    "-",
    tokens["date"](req, res, "clf"),
    "-",
    tokens["response-time"](req, res),
    "ms\n",
  ].join(" ");
}

app.use(morgan(morganFormatted)); //Log to console
app.use(morgan(morganFormatted, { stream: accessLogStream })); //Log to "/logs/access.log"
app.use(bodyParser.json());
app.use(express.static("public"));

let auth = require("./auth")(app); //Endpoint for logging in as a registered user / located in auth.js
require("./passport");
const passport = require("passport");
const cors = require("cors");
app.use(cors());

//1. Return a list of all movies to the user
app.get(
  "/movies",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Movies.find()
      .then((movies) => res.status(200).json(movies))
      .catch((err) => {
        console.log(err);
        res.status(500).json({ error: err });
      });
  }
);

//2. Return data about a single movie to the user by title
app.get(
  "/movies/:title",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let movieName =
      req.params.title.charAt(0).toUpperCase() + req.params.title.slice(1); //format input to match database name format
    await Movies.findOne({
      Title: { $regex: new RegExp(req.params.title, "i") },
    })
      .then((movie) => {
        if (movie) {
          res.status(200).json(movie);
        } else {
          res.status(404).json({
            error:
              "Movie " + req.params.title + " was not found in the database.",
          });
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: err });
      });
  }
);

//3. Return data about a genre by name
app.get(
  "/genres/:name",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    //Uses RegEx to make the search case insensitive and returns only the genre name and description from one movie that contains it
    await Movies.findOne(
      { "Genre.Name": { $regex: new RegExp(req.params.name, "i") } },
      { "Genre.Name": 1, "Genre.Description": 1, _id: 0 }
    )
      .then((genre) => {
        if (genre) {
          res.status(200).json(genre);
        } else {
          res.status(404).json({
            error:
              'Genre "' + req.params.name + '" was not found in the database.',
          });
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: err });
      });
  }
);

//4. Return data about a director by name
app.get(
  "/directors/:name",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    //Uses RegEx to make the search case insensitive and returns only the genre name and description from one movie that contains it
    await Movies.findOne(
      { "Director.Name": { $regex: new RegExp(req.params.name, "i") } },
      { "Director.Name": 1, "Director.Bio": 1, _id: 0 }
    )
      .then((director) => {
        if (director) {
          res.status(200).json(director);
        } else {
          res.status(404).json({
            error:
              'Director "' +
              req.params.name +
              '" was not found in the database.',
          });
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: err });
      });
  }
);

// Get a user by username
app.get(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    await Users.findOne({ Username: req.params.Username })
      .then((user) => {
        user = user.toObject(); // removes the password from the returned user object
        delete user.Password; //

        res.json(user);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: err });
      });
  }
);

//5. Allows new users to register
app.post(
  "/users",
  [
    check(
      "Username",
      "Username needs to be a minimum length of 5 characters."
    ).isLength({ min: 5 }),
    check(
      "Username",
      "Username contains non alphanumeric characters - not allowed."
    ).isAlphanumeric(),
    check("Password", "Password is required").not().isEmpty(),
    check("Email", "Email does not appear to be valid").isEmail(),
  ],
  async (req, res) => {
    // check the validation object for errors
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    let hashedPassword = Users.hashPassword(req.body.Password);
    await Users.findOne({ Username: req.body.Username })
      .then((user) => {
        if (user) {
          return res
            .status(400)
            .json({ error: "User " + req.body.Username + " already exists" });
        } else {
          Users.create({
            Username: req.body.Username,
            Password: hashedPassword,
            Email: req.body.Email,
            Birthday: req.body.Birthday,
          })
            .then((user) => {
              user = user.toObject(); // removes the password from the returned user object
              delete user.Password; //

              res.status(201).json(user);
            })
            .catch((err) => {
              if (err.name === "MongoServerError" && err.code === 11000) {
                // Duplicate email
                return res
                  .status(422)
                  .json({ error: "Email already registered." });
              }
              // Some other error
              return res.status(422).json({ error: err });
            });
        }
      })
      .catch((err) => {
        res.status(500).json({ error: err });
      });
  }
);

//6. Allows users to update their info by username
app.put(
  "/users/:Username",
  [
    oneOf([
      body("Username").not().isEmpty(),
      body("Password").not().isEmpty(),
      body("Email", "Please enter a valid email.")
        .isEmail(),
        body("Birthday", "Birthday needs to be in the follwing format: YYYY-MM-DD")
        .isDate()
    ])
  ],
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    console.log(req.user, req.params.Username);

    // check the validation object for errors
    let errors = validationResult(req);
    // if an error is found, return an json holding an array of errors found
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // condition that checks and makes sure that the username in the request body matches the one in the request parameter
    if (req.user.Username !== req.params.Username) {
      return res.status(400).json({ error: "Permission denied" });
    }

    let hashedPassword;
    if (req.body.Password) {
      hashedPassword = Users.hashPassword(req.body.Password);
    }

    await Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $set: {
          Username: req.body.Username,
          Password: hashedPassword,
          Email: req.body.Email,
          Birthday: req.body.Birthday,
        },
      },
      { new: true }
    ) // This line makes sure that the updated document is returned
      .then((updatedUser) => {
        updatedUser = updatedUser.toObject(); // removes the password from the returned user object
        delete updatedUser.Password; //

        res.status(201).json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: err });
      });
  }
);

//7. Allows users to add a movie to their list of favorites
app.post(
  "/users/:Username/movies/:movieID",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // condition that checks and makes sure that the username in the request body matches the one in the request parameter
    if (req.user.Username !== req.params.Username) {
      return res.status(400).json({ error: "Permission denied" });
    }

    await Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $addToSet: { FavoriteMovies: req.params.movieID },
      },
      { new: true } // This line makes sure that the updated document is returned
    )
      .populate("FavoriteMovies")
      .exec()
      .then((updatedUser) => {
        updatedUser = updatedUser.toObject(); // removes the password from the returned user object
        delete updatedUser.Password; //

        res.status(201).json(updatedUser);
      })
      .catch((err) => {
        res.status(500).json({ error: err });
      });
  }
);

//8. Allows users to remove a movie from their list of favorites
app.delete(
  "/users/:Username/movies/:movieID",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // condition that checks and makes sure that the username in the request body matches the one in the request parameter
    if (req.user.Username !== req.params.Username) {
      return res.status(400).json({ error: "Permission denied" });
    }

    await Users.findOneAndUpdate(
      { Username: req.params.Username },
      {
        $pull: { FavoriteMovies: req.params.movieID },
      },
      { new: true }
    ) // This line makes sure that the updated document is returned
      .then((updatedUser) => {
        updatedUser = updatedUser.toObject(); // removes the password from the returned user object
        delete updatedUser.Password; //

        res.json(updatedUser);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: err });
      });
  }
);

//9. Allows existing users to deregister
app.delete(
  "/users/:Username",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // condition that checks and makes sure that the username in the request body matches the one in the request parameter
    if (req.user.Username !== req.params.Username) {
      return res.status(400).json({ error: "Permission denied" });
    }

    await Users.findOneAndDelete({ Username: req.params.Username })
      .then((user) => {
        if (!user) {
          res
            .status(400)
            .json({ error: "User " + req.params.Username + " was not found" });
        } else {
          res.status(200).json("User " + req.params.Username + " was deleted.");
        }
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ error: err });
      });
  }
);

app.use(function (req, res, next) {
  res.status(404);

  res.send(`<h1>IMFb</h1>
    <h2>404</h2>
    <div>
      Page not found! Go back to the main page from <a href="index.html">here</a>
    </div>`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something broke!" });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log("Listening on Port " + port);
});

// npm dev run <-- for starting with nodemon
