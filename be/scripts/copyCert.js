
const fs = require("node:fs");
const path = require("node:path");

const source = path.join(
  __dirname,
  "../src/database/certs/ca.pem"
);

const destinationDirectory = path.join(
  __dirname,
  "../dist/database/certs"
);

const destination = path.join(
  destinationDirectory,
  "ca.pem"
);

fs.mkdirSync(destinationDirectory, { recursive: true });
fs.copyFileSync(source, destination);

console.log("Aiven CA certificate copied successfully.");
