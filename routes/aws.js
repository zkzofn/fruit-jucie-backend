const AWS = require('aws-sdk');

AWS.config.update({
  accessKeyId: "AKIAJSFPBVHWW5OZ6UMA",
  secretAccessKey: "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"
});

const s3 = new AWS.S3();

export const bucketName = "eatmoregreen";

export const uploadFile = (uniqFileName, data) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: bucketName,
      Key: `images/${uniqFileName}`,
      Body: data,
      ACL: "public-read"
    };

    s3.upload(params)
      .on("httpUploadProgress", evt => console.log(evt))
      .send((err, data) => {
        if (err) reject(err);
        else resolve(data);
      })
  });
};
