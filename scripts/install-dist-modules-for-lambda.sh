#!/bin/bash

docker run --entrypoint="" --rm -v $PWD:/var/task amazon/aws-lambda-nodejs:18 /bin/bash -c "\
  yum update -y && \
  yum install -y git make glibc-devel gcc gcc-c++ patch python3 && \
  npm install -g yarn && \
  yarn global add -y node-gyp @mapbox/node-pre-gyp && \
  yarn install --production --modules-folder dist/node_modules/ \
"