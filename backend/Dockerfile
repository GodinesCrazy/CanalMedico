FROM node:18-alpine

# Instalar PostgreSQL client para Prisma
RUN apk add --no-cache libpq

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

# Crear directorio para logs
RUN mkdir -p logs

# Exponer el puerto
EXPOSE 3000

# Comando de inicio
CMD ["npm", "start"]

