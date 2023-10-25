const express = require("express");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");

const app = express();

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

app.get("/movies", (req, res) => {
  res.sendFile(path.join(__dirname + "/movies.json"));
});

app.get("/movies/:title", (req, res) => {
  res.send(
    "A JSON object holding data about a single movie by title (description, genre, director, image URL)"
  );
});

app.get("/genres/:name", (req, res) => {
  res.send(
    "A JSON object holding data about the name of the genre and a description"
  );
});

app.get("/directors/:name", (req, res) => {
  res.send(
    "A JSON object holding data about a director's name, bio, birth year, and death year"
  );
});

app.post("/users", (req, res) => {
  let newUser = req.body;

  if (newUser.username && newUser.password && newUser.email) {
    newUser.id = uuid.v4();
    res
      .status(201)
      .send(
        "Successfully registered new user: \n" +
          JSON.stringify(newUser, undefined, 4)
      );
  } else {
    const message = "Missing or wrong parameters in request body";
    res.status(400).send(message);
  }
});

app.put("/users/:username", (req, res) => {
  let updatedInfo = req.body;
  res
    .status(201)
    .send(
      "Successfully updated info: \n" +
        JSON.stringify(updatedInfo, undefined, 4)
    );
});

app.post("/users/:username/movies/:movieID", (req, res) => {
  res.send(
    "A text message indicating that the movie has been added to the user's list of favorites"
  );
});

app.delete("/users/:username/movies/:movieID", (req, res) => {
  res.send(
    "A text message indicating that the movie has been removed from the user's list of favorites"
  );
});

app.delete("/users/:username", (req, res) => {
  res.send(
    "A text message indicating that the user has successfully deregistered their account"
  );
});

app.use(function (req, res, next) {
  res.status(404);

  res.send(`<h1>IMFb - A Movie Database Web App</h1>
    <h2>404</h2>
    <div>
      Page not found! Go back to the main page from <a href="index.html">here</a>
    </div>`);
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

app.listen(8080, () => {
  console.log("Your app is listening on port 8080.");
});

// npm dev run <-- for starting with nodemon
