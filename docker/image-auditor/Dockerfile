FROM node:latest
MAINTAINER Michael Ruckstuhl <michael.ruckstuhl@heig-vd.ch>

#
# When we build the image, we copy the executable jar in the image file system. 
#
WORKDIR /opt/app/
COPY src /opt/app/

RUN npm install

EXPOSE 2205

CMD ["node", "/opt/app/auditor.js"]