aws s3 sync ./_site $S3_REPO --delete --cache-control "public, max-age=31536000"