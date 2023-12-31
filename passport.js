const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const Models = require("./models.js");
const passportJWT = require("passport-jwt");

let Users = Models.User;
let JWTStrategy = passportJWT.Strategy;
let ExtractJWT = passportJWT.ExtractJwt;

const cors = require("cors");
passport.use(cors());

passport.use(
  new LocalStrategy(
    {
      passReqToCallback: true
    },
    async (req, asdsad, asdas, callback) => {
      console.log(req.body.username);
      await Users.findOne({ Username: req.body.username })
        .then((user) => {
          if (!user) {
            console.log("incorrect username");
            return callback(null, false, {
              message: "User does not exist.",
            });
          }

          if (!user.validatePassword(req.body.password)) {
            console.log("incorrect password");
            return callback(null, false, { message: "Incorrect password." });
          }

          console.log("finished");
          return callback(null, user);
        })
        .catch((error) => {
          if (error) {
            console.log(error);
            return callback(error);
          }
        });
    }
  )
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: "your_jwt_secret",
    },
    async (jwtPayload, callback) => {
      return await Users.findById(jwtPayload._id)
        .then((user) => {
          return callback(null, user);
        })
        .catch((error) => {
          return callback(error);
        });
    }
  )
);
