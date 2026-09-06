# Multi-stage build for React frontend
FROM node:18-alpine AS builder

WORKDIR /app

# .npmrc sets legacy-peer-deps=true — without it npm ci fails on the
# react-scripts/typescript-5 peer conflict. Dev deps are required here
# (react-scripts, typescript) for the build step below.
COPY package*.json .npmrc ./

RUN npm ci

COPY . .

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
