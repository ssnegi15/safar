FROM node:20-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends openjdk-17-jre-headless \
    && rm -rf /var/lib/apt/lists/*
RUN npm install --global firebase-tools@13.29.2

WORKDIR /workspace
COPY firebase.json ./firebase.json
RUN mkdir -p /home/node/.cache/firebase /data \
    && chown -R node:node /workspace /home/node/.cache /data

ENV HOME=/home/node
EXPOSE 9099

COPY entrypoint.sh /usr/local/bin/firebase-entrypoint
RUN chmod 755 /usr/local/bin/firebase-entrypoint

ENTRYPOINT ["/usr/local/bin/firebase-entrypoint"]
