import express from 'express';
import { pool } from './DBconfig';
import { queryConductor } from './queryConductor';
import multer from 'multer';
import fs from 'fs';
import { uploadFile } from './aws';

const router = express.Router();
const storage = multer.diskStorage({
  destination: "uploads"
});
const upload = multer({
  storage: storage
}).any();

router.post("/", (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      console.log(err);
      return res.end('Error');
    } else {
      const file = req.files[0];

      fs.readFile(`uploads/${file.filename}`, (err, data) => {
        if (err) {
          console.log(err)
        } else {
          uploadFile(file.filename, data).then(data => {
            fs.unlink(`uploads/${file.filename}`, err => {
              console.log(err);
            });
            res.json({imagePath: data.Location});
          }).catch(err => {
            console.log(err)
          });
        }
      });
    }
  });
});

module.exports = router;