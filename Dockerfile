FROM oven/bun
WORKDIR /app

COPY bun.lockb .
COPY package.json .

RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000
CMD [ "bun", "bin/www.js" ]
