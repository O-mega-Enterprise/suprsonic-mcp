FROM node:20-slim
WORKDIR /app
RUN npm install -g suprsonic-mcp
ENTRYPOINT ["suprsonic-mcp"]
