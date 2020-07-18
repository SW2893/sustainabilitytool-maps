FROM python:3.8-alpine
ENV PYTHONUNBUFFERED 1

RUN mkdir /src
WORKDIR /src

ADD pip.conf /etc/
ADD requirements.txt /src/

RUN pip install --upgrade pip && pip install -r requirements.txt
