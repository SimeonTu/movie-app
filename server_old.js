const http = require("http"),
  fs = require("fs"),
  os = require("os"),
  url = require("url");

http
  .createServer((request, response) => {
    let addr = request.url;
    let q = new URL(addr, "http://" + request.headers.host);
    let filePath = "";
    let ip =
      request.headers["x-forwarded-for"] ||
      request.socket.remoteAddress ||
      null;

    console.log("== New request ==")
    console.log("IP: "+ip);
    console.log("URL: "+addr);
    console.log("Date: "+new Date());

    fs.appendFile(
      "log.txt",
      "URL: " +
        addr +
        "\nTimestamp: " +
        new Date() +
        "\nOS: " +
        os.type() +
        "\nIP: " +
        ip +
        "\n\n",
      (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Added to log.\n");
        }
      }
    );

    if (q.pathname == "/") {
      filePath = __dirname + "/index.html";
      fs.readFile(filePath, (err, data) => {
        if (err) {
          throw err;
        }

        response.writeHead(200, { "Content-Type": "text/html" });
        response.write(data);
        response.end();
      });
    } else if (q.pathname.includes("documentation")) {
      filePath = __dirname + "/documentation.html";
      fs.readFile(filePath, (err, data) => {
        if (err) {
          throw err;
        }

        response.writeHead(200, { "Content-Type": "text/html" });
        response.write(data);
        response.end();
      });
    } else {
      fs.readFile(__dirname + "/404.html", (err, data) => {
        if (err) {
          throw err;
        }

        response.writeHead(404, { "Content-Type": "text/html" });
        response.write(data);
        response.end();
      });
    }
  })
  .listen(8080);
console.log("My test server is running on Port 8080.");
