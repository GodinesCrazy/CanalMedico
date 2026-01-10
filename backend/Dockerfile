FROM node:18-alpine

# Instalar PostgreSQL client y OpenSSL para Prisma
RUN apk add --no-cache libpq openssl openssl-dev

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Generar Prisma Client
RUN npx prisma generate

# Copiar el resto del código
COPY . .

# Compilar TypeScript
RUN npm run build

# Guardar build timestamp
RUN echo "Build completed at $(date -Iseconds)" > .build-timestamp || echo "Build completed at $(date)" > .build-timestamp

# Crear directorio para logs
RUN mkdir -p logs

# Exponer el puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]

