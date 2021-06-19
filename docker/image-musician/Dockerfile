FROM node:latest
MAINTAINER Adrien Peguiron <adrien.peguiron@heig-vd.ch>

COPY src /opt/app/

WORKDIR /opt/app/
RUN npm install

ENTRYPOINT ["node", "/opt/app/musician.js"]