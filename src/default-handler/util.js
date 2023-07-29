const { promisify } = require('util');

// NOTE: Not getting nodejs SDK v3 working.
const { ApiGatewayManagementApi } = require('@aws-sdk/client-apigatewaymanagementapi');
//const { ApiGatewayManagementApi } = require("aws-sdk");

const { Buffer } = require('buffer');
const { Glue } = require('@aws-sdk/client-glue');
const { S3 } = require('@aws-sdk/client-s3');

const sleep = promisify(setTimeout);
const isStream = require('is-stream');

function getWebSocket(event) {
  // NOTE: Not getting nodejs SDK v3 working.
  const endpoint = 'https://' + event.requestContext.domainName + '/' + event.requestContext.stage;
  const webSocket = new ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint,
  });
  // const endpoint =
  //   event.requestContext.domainName + "/" + event.requestContext.stage;
  // return new ApiGatewayManagementApi({ apiVersion: "2018-11-29", endpoint });
  return webSocket;
}

function postToWebSocket(webSocket, ConnectionId, Data) {
  try {
    return webSocket.postToConnection({ ConnectionId, Data }).promise();
    // NOTE: Not getting nodejs SDK v3 working.
    // return webSocket.postToConnection({ ConnectionId, Data });
  } catch (err) {
    console.log(JSON.stringify(err, null, 2));
  }
}

async function streamToWebSocket({ webSocket, ConnectionId, rowsStream, dataQueue, concurrency }) {
  let payloadSent = 0;
  return new Promise(resolve => {
    if (!isStream.readable(rowsStream)) resolve(payloadSent);
    rowsStream.on('data', async chunk => {
      if (!chunk.Records || !chunk.Records.Payload) return;
      while (dataQueue.pending >= concurrency) await sleep(5);
      const data = Buffer.from(chunk.Records.Payload).toString();
      payloadSent += data.length;
      dataQueue.add(() => postToWebSocket(webSocket, ConnectionId, data));
    });
    rowsStream.on('end', () => {
      console.log('stream end.');
      resolve(payloadSent);
    });
  });
}

function getS3SelectableParams(event) {
  const regex = /FROM\s+([a-z0-9_]+)\.([a-z0-9_]+)/gim;
  const [databaseName, tableName] = event.body.match(regex)[0].trim().substr(5).split('.');
  const sql = event.body.replace(regex, () => `FROM s3Object`);
  const s3 = new S3({ region: 'eu-west-1' });
  const glue = new Glue({ region: 'eu-west-1' });
  const logLevel = 'debug';
  return { databaseName, tableName, s3, glue, sql, logLevel };
}

module.exports = {
  getWebSocket,
  postToWebSocket,
  streamToWebSocket,
  getS3SelectableParams,
};
