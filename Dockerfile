FROM mhart/alpine-node:base-6
# FROM mhart/alpine-node:6

# dependencies
ADD ./node_modules ./node_modules

# actual code
ADD ./bin ./bin
WORKDIR /bin

# If you have native dependencies, you'll need extra tools
# RUN apk add --no-cache make gcc g++ python

# If you need npm, don't use a base tag
# RUN npm install

EXPOSE 3000
CMD ["node", "index.js"]