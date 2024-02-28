const jwtSecret = "your_jwt_secret"; // This has to be the same key used in the JWTStrategy
const jwt = require("jsonwebtoken");
const passport = require("passport");
require("./passport"); // Your local passport file

let generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.Username, // This is the username you’re encoding in the JWT
    expiresIn: "7d", // This specifies that the token will expire in 7 days
    algorithm: "HS256", // This is the algorithm used to “sign” or encode the values of the JWT
  });
};

// const cors = require("cors");
// passport.use(cors());

const cors = require("cors");
let allowedOrigins = ["https://ifdbase.netlify.app", "http://localhost:1234", "http://localhost:4200"];

passport.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        // If a specific origin isn’t found on the list of allowed origins
        let message =
          "The CORS policy for this application doesn’t allow access from origin " +
          origin;
        return callback(new Error(message), false);
      }
      return callback(null, true);
    },
  })
);

/* POST login. */
module.exports = (router) => {
  router.post("/login", (req, res) => {
    passport.authenticate("local", { session: false }, (err, user, info) => {
      if (err || !user) {
        console.log(err);
        console.log(user);
        console.log(info);
        // console.log(message)
        return res.status(400).json({
          message: info.message,
          user: user,
        });
      }
      req.login(user, { session: false }, (err) => {
        if (err) {
          res.json({ error: err });
        }
        let token = generateJWTToken(user.toJSON());

        user = user.toObject(); // removes the password from the returned user object
        delete user.Password; //

        return res.json({ user, token });
      });
    })(req, res);
  });
};
