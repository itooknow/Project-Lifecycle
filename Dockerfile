# Stage 1: Build the React/Vite Application
FROM node:20-alpine AS builder
WORKDIR /app

# Enable caching of dependencies
COPY package*.json ./
RUN npm ci

# Copy codebase and compile production static assets
COPY . .
RUN npm run build

# Stage 2: Serve compiled files using Nginx
FROM nginx:1.25-alpine
LABEL maintainer="itooknowng@gmail.com"

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts to the default Nginx web root directory
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]