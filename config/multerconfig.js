const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
// disk storage setup
// and create upload object or variable and export it

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/uploads");
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(12, (err, name) => {
      let fn = name.toString("hex") + path.extname(file.originalname); //creating a unique file name with extension
      cb(null, fn);
    });
  },
});

const upload = multer({ storage: storage });
module.exports = upload;
