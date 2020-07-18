#!/usr/bin/env bash

export HOST_SRC_PATH="$(dirname "$(dirname "$(readlink -fm "$0")")")"/
echo "HOST SRC PATH = $HOST_SRC_PATH"

case "$1" in
dev)
  docker-compose -f ${HOST_SRC_PATH}docker/local/docker-stack.yml up nginx
  ;;
python)
  docker run --rm -it -v ${HOST_SRC_PATH}/src:/src --env-file $HOME/.secrets/GOOGLE_MAPS_API_KEY python:3.8-alpine sh
  ;;
node)
  docker run --rm -it -v ${HOST_SRC_PATH}/src:/src/ node:10.14-slim sh
  ;;
parse)
  docker run --rm -it -v ${HOST_SRC_PATH}/src:/src --env-file $HOME/.secrets/GOOGLE_MAPS_API_KEY python:3.8-alpine python /src/mep/parse.py
  ;;
build)
  docker run --rm -it -v ${HOST_SRC_PATH}/src:/src --env-file $HOME/.secrets/GOOGLE_MAPS_API_KEY python:3.8-alpine python /src/build.py
  ;;
down)
  docker-compose -f ${HOST_SRC_PATH}docker/local/docker-stack.yml down
  ;;
*)
  echo $"Usage: $0 { dev | python | node | parse | build | down }"
  exit 1
  ;;

esac
