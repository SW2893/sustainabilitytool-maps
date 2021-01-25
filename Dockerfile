FROM python:3.8-alpine
ENV PYTHONUNBUFFERED 1

RUN mkdir /src
WORKDIR /src

ADD ./src /src
ADD ./docker/local/python/pip.conf /etc/
ADD ./docker/local/python/requirements.txt /src/

RUN pip install --upgrade pip && pip install -r requirements.txt
