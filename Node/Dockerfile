FROM node:8.1.2-alpine

#Make directory for app
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

#Have to install Python for one of the npm dependencies
RUN apk add --update python make g++

#Copy in NodeJS files for final production
ADD app ./

#Install node dependencies
RUN npm install

EXPOSE 80

CMD [ "node", "app.js" ]
