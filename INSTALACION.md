# Guía de Instalación - Sistema de Gestión de Tareas

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:
- **Node.js** (versión 14 o superior): [Descargar Node.js](https://nodejs.org/)
- **MySQL** (versión 5.7 o superior): [Descargar MySQL](https://dev.mysql.com/downloads/)
- **npm** (viene con Node.js)

## Pasos de Instalación

### 1. Instalar Dependencias de Node.js

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
```

Esto instalará todas las dependencias necesarias (Express, MySQL2, bcryptjs, etc.)

### 2. Configurar MySQL

#### Opción A: Desde la línea de comandos

1. Abre MySQL Command Line Client o una terminal con acceso a MySQL
2. Ejecuta los siguientes comandos:

```bash
mysql -u root -p < database/schema.sql
```

Cuando te pida la contraseña, ingresa la contraseña de tu usuario root de MySQL.

#### Opción B: Desde MySQL Workbench o phpMyAdmin

1. Abre MySQL Workbench o phpMyAdmin
2. Ejecuta el contenido de `database/schema.sql` primero
3. Luego ejecuta el contenido de `database/init.sql`

### 3. Configurar Variables de Entorno

1. Crea un archivo llamado `.env` en la raíz del proyecto
2. Copia el siguiente contenido y ajusta los valores según tu configuración:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_contraseña_mysql
DB_NAME=task_manager_db
JWT_SECRET=tu_secreto_jwt_muy_seguro_cambiar_en_produccion
```

**Importante**: 
- Reemplaza `tu_contraseña_mysql` con tu contraseña real de MySQL
- Cambia `JWT_SECRET` por una cadena aleatoria segura (puedes generar una con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

### 4. Iniciar el Servidor

#### Modo Producción:
```bash
npm start
```

#### Modo Desarrollo (con recarga automática):
```bash
npm run dev
```

Si todo está correcto, verás un mensaje como:
```
Servidor corriendo en http://localhost:3000
Base de datos: task_manager_db
```

### 5. Abrir la Aplicación

Abre tu navegador web y visita:
```
http://localhost:3000
```

## Usuarios de Prueba

El script de inicialización crea los siguientes usuarios de prueba (todos con contraseña: `admin123`):

- **Email**: admin@example.com
- **Email**: juan@example.com  
- **Email**: maria@example.com

**Contraseña para todos**: `admin123`

## Solución de Problemas

### Error: "Cannot find module"
- Asegúrate de haber ejecutado `npm install`
- Verifica que estás en la carpeta correcta del proyecto

### Error de conexión a MySQL
- Verifica que MySQL está corriendo
- Revisa las credenciales en el archivo `.env`
- Asegúrate de que la base de datos `task_manager_db` existe

### Error: "Port 3000 already in use"
- Cambia el puerto en el archivo `.env` (ej: `PORT=3001`)
- O cierra la aplicación que está usando el puerto 3000

### Error al ejecutar scripts SQL
- Asegúrate de ejecutar `schema.sql` antes que `init.sql`
- Verifica que tienes permisos para crear bases de datos

## Verificación

Para verificar que todo funciona correctamente:

1. El servidor debe iniciar sin errores
2. Debes poder acceder a `http://localhost:3000` en tu navegador
3. Debes poder registrarte o iniciar sesión con un usuario de prueba
4. Debes poder crear, editar y eliminar tareas

## Siguiente Paso

Una vez que la aplicación esté corriendo, consulta el `README.md` para más información sobre cómo usar la aplicación y su API.

