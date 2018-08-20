import express from 'express';
import { pool } from './DBconfig';
import { queryConductor } from './queryConductor';
import AWS from 'aws-sdk';
import formidable from 'formidable';

const router = express.Router();

router.post("/", (req, res, next) => {
  // const {file} = req.body;
  // const fileUrl = URL.createObjectURL(file);

  // const formData = new Blob(file);

  // console.log(formData);
  // console.log(fileUrl);
  // const test = req.images;

  // console.log(req);
  const form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    console.log(files);

    //여기서 file s3에 upload 하도록
    res.end();
  });


  // console.log(formData);
  // res.json({formData});
  // res.end();


  // const s3 = new AWS.S3({
  //   accessKeyId: "AKIAJSFPBVHWW5OZ6UMA",
  //   secretAccessKey: "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",
  //   Bucket: "eatmoregreem"
  // });
  //
  // s3.createBucket(() => {
  //   const params = {
  //     Bucket: "eatmoregreem",
  //     Key: file.name,
  //     Body: file.data,
  //   };
  //   s3bucket.upload(params, function (err, data) {
  //     if (err) {
  //       console.log('error in callback');
  //       console.log(err);
  //     }
  //     console.log('success');
  //     console.log(data);
  //   });
  // });


  //
  // s3.putObject({
  //   Bucket: 'eatmoregreem',
  //   Key: 'images',
  //   Body: req.body,
  //   ACL: 'public-read', // your permisions
  // }, (err, data) => {
  //   if (err) return res.status(400).send(err);
  //
  //   console.log(data);
  //   res.send('File uploaded to S3');
  // })

});

module.exports = router;