
# Imagen de Node.js para el proyecto Expo
FROM node:22-bookworm-slim

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiar los archivos de dependencias
COPY package.json package-lock.json ./

# Instalar las dependencias exactas
RUN npm ci

# Copiar el resto del proyecto
COPY . .

# Puerto utilizado por Expo
EXPOSE 8081

# Iniciar Expo
CMD ["npx", "expo", "start", "--host", "lan"]
