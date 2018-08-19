/**
 * Primary file for the API
 */

const http = require("http");
const https = require("https");
const fs = require("fs");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require("./config");

// Configure the server to receive requests and send response
const httpServer = http.createServer(function(req, res) {
  unifiedServer(req, res);
});

httpServer.listen(config.httpPort, function() {
  console.log(
    "The HTTP server has been started on port " +
      config.httpPort +
      " Environment " +
      config.envName
  );
});

const httpsServerOptions = {
  key: fs.readFileSync("./https/key.pem"),
  cert: fs.readFileSync("./https/cert.pem")
};

const httpsServer = https.createServer(httpsServerOptions, (req, res) => {
  unifiedServer(req, res);
});

httpsServer.listen(config.httpsPort, function() {
  console.log(
    "The HTTPS server has been started on port " +
      config.httpsPort +
      " Environment " +
      config.envName
  );
});

const unifiedServer = (req, res) => {
  // parse url
  const parsedUrl = url.parse(req.url, true);

  // Get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, "");

  // Get the query string as an object
  const queryStringObject = parsedUrl.query;

  // Get the HTTP Method
  const method = req.method.toLowerCase();

  // Get the headers as an object
  const headers = req.headers;

  // Get the payload as an object
  const decoder = new StringDecoder("utf-8");
  let buffer = "";

  req.on("data", function(data) {
    buffer += decoder.write(data);
  });

  req.on("end", function() {
    buffer += decoder.end();

    // Check the router for matching path for a handler. If one is not found, use the notFound handler instead.
    const chosenHandler =
      typeof router[trimmedPath] !== "undefined"
        ? router[trimmedPath]
        : handlers.notFound;

    // Construct data object to be sent to handler
    const data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: buffer
    };

    // Route the request to the handler specified in the router
    chosenHandler(data, function(statusCode, payload) {
      // use the status code returned from handler or set the default status code to 200
      statusCode = typeof statusCode === "number" ? statusCode : 200;

      // Use the payload returned from handler, or set the default payload to an empty object
      payload = typeof payload === "object" ? payload : {};

      // Convert payload to string
      const payloadString = JSON.stringify(payload);

      // Return the response
      res.setHeader("Content-Type", "application/json");
      res.writeHead(statusCode);
      res.end(payloadString);
      console.log("returning this response: ", statusCode);
    });
  });
};

// Define all the handlers
const handlers = {};

handlers.hello = function(data, callback) {
  callback(200, { message: "hello world" });
};

// Sample handler
handlers.ping = function(data, callback) {
  callback(200);
};

// Not found handler
handlers.notFound = function(data, callback) {
  callback(404);
};

// define the request router
const router = {
  ping: handlers.ping,
  hello: handlers.hello
};
