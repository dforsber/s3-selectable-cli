#!/bin/bash

docker run --rm -v $PWD:/var/task lambci/lambda:build-nodejs12.x /bin/bash -c "\
  yum update -y && \
  yum install -y make glibc-devel gcc patch && \
  npm install -g yarn && \
  yarn global add -y node-gyp node-pre-gyp && \
  yarn --production --modules-folder dist/node_modules/\
" 