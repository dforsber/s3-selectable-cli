const { SharedIniFileCredentials } = require('aws-sdk');
const { Signer } = require('@aws-amplify/core');
const process = require('process');

async function getSignedWssUrl(wssUrl) {
  const creds = new SharedIniFileCredentials();
  const signed = await Signer.signUrl(wssUrl, {
    access_key: creds.accessKeyId,
    secret_key: creds.secretAccessKey,
    session_token: creds.sessionToken,
  });
  console.log(signed);
}

getSignedWssUrl(process.argv[2]);
