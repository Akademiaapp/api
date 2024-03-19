FROM oven/bun:1.0.18
WORKDIR /app

COPY bun.lockb .
COPY package.json .

RUN bun install --frozen-lockfile

COPY . .

RUN bun prisma generate

EXPOSE 3000
CMD [ "bun", "bin/www.js" ]
