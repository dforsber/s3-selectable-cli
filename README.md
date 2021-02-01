# S3 Selectable WebSocket for clients

This is Infrastructure as Code (IaC) for creating WebSocket API for [@dforsber/s3-selectable](https://github.com/dforsber/s3-selectable).

NOTE: This repository was started off from the [simple webchat client demo from AWS](https://github.com/aws-samples/simple-websockets-chat-app). We mostly use the IaC part of it, but greatly reduced and with modifications.

Simple WebSocket based S3 Selectable client to be used e.g. with [wscat](https://github.com/websockets/wscat). We set the `$connect` route authorisation to be `AWS_IAM` and use signed `wss://` URLs to get it working without a custom authoriser.

```shell
% yarn
% yarn deploy
```

## Sample data

You can [create a Glue Table based on public NYC taxi data set in Parquet](http://amazonathenahandson.s3-website-us-east-1.amazonaws.com/part1.html). Below we use the public data set (on a local AWS Account copy) for the example queries.

## Example

You get the API ID from the deployment output.

```shell
#  AWS IAM Authenticated WebSocket connect brings up the command line
% wscat -c `node src/wss-signer/sign_wss_url.js wss://apiId.execute-api.eu-west-1.amazonaws.com/dev`

#  Default route invokes S3 Selectable Lambda asynchronously,
#  and passes the WebSocket URL as a parameterand sends results to WebSocket
% wscat -c `node src/wss-signer/sign_wss_url.js wss://8zs4y08ig2.execute-api.eu-west-1.amazonaws.com/dev`
Connected (press CTRL+C to quit)
> EXPLAIN SELECT * FROM default.nyctaxis LIMIT 2
< {
  selectParams: { selectParams: { Expression: ' SELECT * FROM s3Object LIMIT 2' } },
  explainSelectResult: {
    tableInfo: {
      Bucket: 'serverless-analytics',
      PartitionColumns: [ 'year', 'month', 'type' ],
      InputSerialization: { Parquet: {} }
    },
    preparedSelect: {
      selectParams: {
        ExpressionType: 'SQL',
        OutputSerialization: { JSON: {} },
        Expression: 'SELECT * FROM s3Object LIMIT 1',
        Bucket: 'isecurefi-serverless-analytics',
        InputSerialization: { Parquet: {} }
      },
      limit: 2,
      s3Keys: [
        'NY-Pub/year=2016/month=6/type=yellow/part-r-03242-6e222bd6-47be-424a-a29a-606961a23de1.gz.parquet',
        'NY-Pub/year=2016/month=6/type=yellow/part-r-03242-90b05037-c70b-4bc7-978c-b53b496c4751.gz.parquet'
      ]
    },
    partitionFilter: 'SELECT partition FROM partitions '
  }
}
< Execution time 1527 ms, 0.000 MB, 0.000 MB/s

##
> SELECT * FROM default.nyctaxis LIMIT 2
< {"vendorid":"2","pickup_datetime":45333777451676830864349184,"dropoff_datetime":45333777451677222864349184,"ratecode":1,"passenger_count":2,"trip_distance":0.79e0,"fare_amount":6e0,"total_amount":0.3e0,"payment_type":2}

< {"vendorid":"2","pickup_datetime":45333777451676830864349184,"dropoff_datetime":45333777451677222864349184,"ratecode":1,"passenger_count":2,"trip_distance":0.79e0,"fare_amount":6e0,"total_amount":0.3e0,"payment_type":2}

< Execution time 1526 ms, 0.000 MB, 0.000 MB/s
> EXPLAIN SELECT * FROM default.nyctaxis WHERE year=2016 AND month=10 AND `type`='yellow' LIMIT 10
< {
  selectParams: {
    selectParams: {
      Expression: " SELECT * FROM s3Object WHERE year=2016 AND month=10 AND `type`='yellow' LIMIT 10"
    }
  },
  explainSelectResult: {
    tableInfo: {
      Bucket: 'isecurefi-serverless-analytics',
      PartitionColumns: [ 'year', 'month', 'type' ],
      InputSerialization: { Parquet: {} }
    },
    preparedSelect: {
      selectParams: {
        ExpressionType: 'SQL',
        OutputSerialization: { JSON: {} },
        Expression: 'SELECT * FROM s3Object WHERE TRUE AND TRUE AND TRUE LIMIT 1',
        Bucket: 'isecurefi-serverless-analytics',
        InputSerialization: { Parquet: {} }
      },
      limit: 10,
      s3Keys: [
        'NY-Pub/year=2016/month=10/type=yellow/part-r-03310-6e222bd6-47be-424a-a29a-606961a23de1.gz.parquet',
        'NY-Pub/year=2016/month=10/type=yellow/part-r-03310-90b05037-c70b-4bc7-978c-b53b496c4751.gz.parquet',
        'NY-Pub/year=2016/month=10/type=yellow/part-r-03311-6e222bd6-47be-424a-a29a-606961a23de1.gz.parquet',
        'NY-Pub/year=2016/month=10/type=yellow/part-r-03311-90b05037-c70b-4bc7-978c-b53b496c4751.gz.parquet',
        'NY-Pub/year=2016/month=10/type=yellow/part-r-03312-6e222bd6-47be-424a-a29a-606961a23de1.gz.parquet',
        'NY-Pub/year=2016/month=10/type=yellow/part-r-03312-90b05037-c70b-4bc7-978c-b53b496c4751.gz.parquet',
        'NY-Pub/year=2016/month=10/type=yellow/part-r-03313-6e222bd6-47be-424a-a29a-606961a23de1.gz.parquet',
        'NY-Pub/year=2016/month=10/type=yellow/part-r-03313-90b05037-c70b-4bc7-978c-b53b496c4751.gz.parquet',
        'NY-Pub/year=2016/month=10/type=yellow/part-r-03314-6e222bd6-47be-424a-a29a-606961a23de1.gz.parquet',
        'NY-Pub/year=2016/month=10/type=yellow/part-r-03314-90b05037-c70b-4bc7-978c-b53b496c4751.gz.parquet'
      ]
    },
    partitionFilter: "SELECT partition FROM partitions WHERE `year` = 2016 AND `month` = 10 AND `type` = 'yellow'"
  }
}
< Execution time 706 ms, 0.000 MB, 0.000 MB/s

##
> SELECT * FROM default.nyctaxis WHERE year=2016 AND month=10 AND `type`='yellow' LIMIT 10
< {"vendorid":"1","pickup_datetime":45335880380425237753233408,"dropoff_datetime":45335880380425882753233408,"ratecode":80,"passenger_count":3,"trip_distance":3.4e0,"fare_amount":0.5e0,"payment_type":1}

< {"vendorid":"1","pickup_datetime":45335954167429495591439872,"dropoff_datetime":45335954167430186591439872,"ratecode":161,"passenger_count":2,"trip_distance":2.3e0,"fare_amount":0.5e0,"payment_type":0}

< {"vendorid":"2","pickup_datetime":45336027954427835429646336,"dropoff_datetime":45336027954430065429646336,"ratecode":246,"passenger_count":5,"trip_distance":1.81e0,"fare_amount":0.5e0,"payment_type":0}

< {"vendorid":"1","pickup_datetime":45335972614229402300991488,"dropoff_datetime":45335972614230757300991488,"ratecode":237,"passenger_count":1,"trip_distance":3.4e0,"fare_amount":0.5e0,"payment_type":1}

< {"vendorid":"2","pickup_datetime":45335917273964175172336640,"dropoff_datetime":45335917273964460172336640,"ratecode":143,"passenger_count":1,"trip_distance":0.89e0,"fare_amount":0.5e0,"payment_type":0}

< {"vendorid":"1","pickup_datetime":45335972614229402300991488,"dropoff_datetime":45335972614230757300991488,"ratecode":237,"passenger_count":1,"trip_distance":3.4e0,"fare_amount":0.5e0,"payment_type":1}

< {"vendorid":"1","pickup_datetime":45335954167429495591439872,"dropoff_datetime":45335954167430186591439872,"ratecode":161,"passenger_count":2,"trip_distance":2.3e0,"fare_amount":0.5e0,"payment_type":0}

< {"vendorid":"2","pickup_datetime":45335917273964175172336640,"dropoff_datetime":45335917273964460172336640,"ratecode":143,"passenger_count":1,"trip_distance":0.89e0,"fare_amount":0.5e0,"payment_type":0}

< {"vendorid":"1","pickup_datetime":45335880380425237753233408,"dropoff_datetime":45335880380425882753233408,"ratecode":80,"passenger_count":3,"trip_distance":3.4e0,"fare_amount":0.5e0,"payment_type":1}

< {"vendorid":"2","pickup_datetime":45336027954427835429646336,"dropoff_datetime":45336027954430065429646336,"ratecode":246,"passenger_count":5,"trip_distance":1.81e0,"fare_amount":0.5e0,"payment_type":0}

< Execution time 1247 ms, 0.002 MB, 0.002 MB/s
>
```
