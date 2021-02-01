const {
  getS3SelectableParams,
  getWebSocket,
  postToWebSocket,
  streamToWebSocket,
} = require("./util");
const { Readable } = require("stream");
const { S3Selectable } = require("@dforsber/s3-selectable");
const { inspect } = require("util");
const { default: PQueue } = require("p-queue");
const process = require("process");

const concurrency = parseInt(process.env.PQUEUE_CONCURRENCY || "1");
const timeout = parseInt(process.env.PQEUEU_TIMEOUT || "10000");
const dataQueue = new PQueue({ concurrency, timeout, throwOnTimeout: true });

async function outputStatsRow(webSocket, ConnectionId, runtime, payloadSent) {
  const transferredMB = (payloadSent / (1024 * 1024)).toFixed(3);
  const throughput = (transferredMB / (runtime / 1000)).toFixed(3);
  await postToWebSocket(
    webSocket,
    ConnectionId,
    `Execution time ${runtime} ms, ${transferredMB} MB, ${throughput} MB/s`
  );
}

async function handleDefault(event, webSocket, ConnectionId) {
  const selParams = getS3SelectableParams(event);
  const selectable = new S3Selectable(selParams);
  const params = { webSocket, ConnectionId, selectable, sql: selParams.sql };
  const isExplain = selParams.sql.toLowerCase().startsWith("explain ");
  return isExplain ? explainSelect(params) : select(params);
}

async function explainSelect({ webSocket, ConnectionId, selectable, sql }) {
  const Expression = sql.substr(7);
  const selectParams = { selectParams: { Expression } };
  const start = Date.now();
  const explainSelectResult = await selectable.explainSelect(selectParams);
  const explained = { selectParams, explainSelectResult };
  await postToWebSocket(webSocket, ConnectionId, inspect(explained, false, 7));
  await outputStatsRow(webSocket, ConnectionId, Date.now() - start, 0);
  return { statusCode: 200, body: JSON.stringify(explained) };
}

async function select({ webSocket, ConnectionId, selectable, sql }) {
  const start = Date.now();
  const selParams = { selectParams: { Expression: sql } };
  const s = await selectable.select(selParams);
  const rowsStream = s ? Readable.from(s, { objectMode: true }) : undefined;
  const sockParams = { webSocket, ConnectionId, rowsStream, dataQueue };
  const dataSent = await streamToWebSocket({ ...sockParams, concurrency });
  await dataQueue.onIdle();
  await outputStatsRow(webSocket, ConnectionId, Date.now() - start, dataSent);
  return { statusCode: 200, body: "Data sent" };
}

function initRequestHandler(event) {
  console.log("concurrency:", concurrency, "timeout:", timeout);
  return getWebSocket(event);
}

exports.handler = async function (event) {
  console.log(inspect(event, false, 7));
  if (!event.body) return { statusCode: 200, body: "no data" };
  const webSocket = initRequestHandler(event);
  const ConnectionId = event.requestContext.connectionId;
  const resp = await handleDefault(event, webSocket, ConnectionId).catch(
    async (err) => {
      console.error(err);
      await postToWebSocket(webSocket, ConnectionId, inspect(err, false, 7));
    }
  );
  return resp;
};

/*
exports.handler({
  requestContext: {
    connectionId: 123,
    domainName: "my.domain.com",
    stage: "dev",
  },
  body: "SELECT * FROM default.partitioned_elb_logs LIMIT 10",
});
*/
