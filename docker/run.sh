#!/usr/bin/env bash

export HOST_SRC_PATH="$(dirname "$(dirname "$(readlink -fm "$0")")")"/
echo "HOST SRC PATH = $HOST_SRC_PATH"

case "$1" in
dev)
  #docker stack deploy -c ${HOST_SRC_PATH}docker/local/docker-stack.yml scsmaps
  docker-compose -f ${HOST_SRC_PATH}docker/local/docker-stack.yml up nginx
  ;;
parse)
  docker run --rm -it -v $PWD/src:/src --env-file $HOME/.secrets/GOOGLE_MAPS_API_KEY python:3.8-alpine python /src/mep/parse.py
  ;;
build)
  docker run --rm -it -v $PWD/src:/src --env-file $HOME/.secrets/GOOGLE_MAPS_API_KEY python:3.8-alpine python /src/build.py
  ;;
down)
  #docker stack down scsmaps
  docker-compose -f ${HOST_SRC_PATH}docker/local/docker-stack.yml down
  ;;
*)
  echo $"Usage: $0 { dev | python | down }"
  exit 1
  ;;

esac
