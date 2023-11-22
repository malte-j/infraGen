# python 3.7 
FROM python:3.10
# install graphviz
RUN apt-get update && apt-get install -y graphviz
# set working directory
WORKDIR /usr/src/app

RUN pip install fastapi
RUN pip install "uvicorn[standard]"
