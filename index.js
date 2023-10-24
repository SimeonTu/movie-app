const express = require("express");
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

app.use(express.static("public"));

app.get("/movies", (req, res) => {
  res.sendFile(path.join(__dirname + "/movies.json"));
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
