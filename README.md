# S3 Selectable WebSocket for clients

This is Infrastructure as Code (IaC) for creating WebSocket API for [@dforsber/s3-selectable](https://github.com/dforsber/s3-selectable).

NOTE: This repository was started off from the [simple webchat client demo from AWS](https://github.com/aws-samples/simple-websockets-chat-app). We mostly use the IaC part of it, but greatly reduced and with modifications.

Simple WebSocket based S3 Selectable client to be used e.g. with [wscat](https://github.com/websockets/wscat). We set the `$connect` route authorisation to be `AWS_IAM` and use signed `wss://` URLs to get it working without a custom authoriser.

```shell
% yarn
% yarn deploy
```

## Sample data

You can check the TS code on [NYC-taxi-data](NYC-taxi-data/) folder or [create a Glue Table based on public NYC taxi data set in Parquet](http://amazonathenahandson.s3-website-us-east-1.amazonaws.com/part1.html). Below we use the public data set for the example queries.

## Example

You get the API ID from the deployment output.

```shell
#  AWS IAM Authenticated WebSocket connect brings up the command line
% wscat -c `node src/wss-signer/sign_wss_url.js wss://8zs4y08ig2.execute-api.eu-west-1.amazonaws.com/dev`

#  Default route invokes S3 Selectable Lambda asynchronously,
#  and passes the WebSocket URL as a parameterand sends results to WebSocket
> SELECT COUNT(*) FROM default.taxis
>
```
