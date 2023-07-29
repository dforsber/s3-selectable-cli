const { fromNodeProviderChain } = require('@aws-sdk/credential-providers');
const { Signer } = require('@aws-amplify/core');
const process = require('process');

async function getSignedWssUrl(wssUrl) {
  const creds = await fromNodeProviderChain()();
  const accessInfo = {
    access_key: creds.accessKeyId,
    secret_key: creds.secretAccessKey,
    session_token: creds.sessionToken,
  };
  const signed = await Signer.signUrl(wssUrl, accessInfo);
  console.log(signed);
}

getSignedWssUrl(process.argv[2]);
