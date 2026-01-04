FROM node:22-alpine AS base
WORKDIR /app/server

# Instalar dependencias del servidor únicamente
COPY server/package*.json ./
RUN npm ci --only=production

# Copiar código del servidor
COPY server/. .

# Variables por defecto (pueden ser reemplazadas en Koyeb)
ENV NODE_ENV=production
ENV PORT=3001

# Exponer puerto de la API
EXPOSE 3001

# Comando de arranque (usa el script start del server)
CMD ["npm", "start"]
