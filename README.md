# Sistema de Gestión de Tareas Web

**Grupo 2 - ITLA Virtual**  
**Asignatura: Sistemas y Computación I**

## Descripción del Proyecto

Este proyecto consiste en una aplicación web completa de gestión de tareas que permite a los usuarios registrar, organizar, editar y eliminar tareas, así como asignar fechas de vencimiento y prioridades a cada tarea.

## Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica de la aplicación
- **CSS3**: Diseño moderno y responsive con variables CSS y animaciones
- **JavaScript (Vanilla)**: Lógica del cliente, comunicación con API RESTful

### Backend
- **Node.js**: Entorno de ejecución del servidor
- **Express.js**: Framework web para crear la API RESTful
- **MySQL2**: Driver para conexión con base de datos MySQL
- **bcryptjs**: Encriptación de contraseñas
- **jsonwebtoken**: Autenticación mediante JWT
- **express-validator**: Validación de datos de entrada

### Base de Datos
- **MySQL**: Sistema de gestión de bases de datos relacional

## Características Implementadas

### Funcionalidades de Usuario
- ✅ Registro de usuarios
- ✅ Inicio de sesión con autenticación segura
- ✅ Cierre de sesión

### Funcionalidades de Tareas
- ✅ Crear nuevas tareas
- ✅ Listar todas las tareas del usuario
- ✅ Editar tareas existentes
- ✅ Eliminar tareas
- ✅ Asignar fecha de vencimiento
- ✅ Asignar prioridad (baja, media, alta)
- ✅ Cambiar estado (pendiente, en progreso, completada)
- ✅ Filtrar tareas por prioridad y estado
- ✅ Interfaz responsive y moderna

### Seguridad
- ✅ Autenticación de usuarios mediante JWT
- ✅ Encriptación de contraseñas con bcrypt
- ✅ Validación de datos en frontend y backend
- ✅ Protección de rutas mediante middleware de autenticación
- ✅ Prevención de XSS mediante escape de HTML

## Estructura del Proyecto

```
WEB/
├── database/
│   ├── schema.sql          # Esquema de la base de datos
│   └── init.sql            # Script de inicialización con datos de ejemplo
├── public/
│   ├── index.html          # Página principal de la aplicación
│   ├── styles.css          # Estilos CSS
│   └── app.js              # Lógica JavaScript del frontend
├── server.js               # Servidor Express y API RESTful
├── package.json            # Dependencias del proyecto
├── .env.example           # Ejemplo de variables de entorno
└── README.md              # Documentación del proyecto
```

## Instalación y Configuración

### Requisitos Previos
- Node.js (v14 o superior)
- MySQL (v5.7 o superior)
- npm o yarn

### Pasos de Instalación

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias de Node.js**
   ```bash
   npm install
   ```

3. **Configurar la base de datos MySQL**
   
   Inicia tu servidor MySQL y ejecuta los scripts en orden:
   ```bash
   mysql -u root -p < database/schema.sql
   mysql -u root -p < database/init.sql
   ```
   
   O desde la línea de comandos de MySQL:
   ```sql
   source database/schema.sql;
   source database/init.sql;
   ```

4. **Configurar variables de entorno**
   
   Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=tu_contraseña_mysql
   DB_NAME=task_manager_db
   JWT_SECRET=tu_secreto_jwt_muy_seguro_cambiar_en_produccion
   ```

5. **Iniciar el servidor**
   ```bash
   npm start
   ```
   
   Para desarrollo con recarga automática:
   ```bash
   npm run dev
   ```

6. **Abrir la aplicación**
   
   Abre tu navegador y visita: `http://localhost:3000`

## Uso de la Aplicación

### Registro de Usuario
1. Haz clic en la pestaña "Registrarse"
2. Completa el formulario con nombre, email y contraseña (mínimo 6 caracteres)
3. Haz clic en "Registrarse"

### Iniciar Sesión
1. Ingresa tu email y contraseña
2. Haz clic en "Iniciar Sesión"

### Gestionar Tareas
- **Crear tarea**: Haz clic en el botón "+ Nueva Tarea"
- **Editar tarea**: Haz clic en "Editar" en la tarjeta de la tarea
- **Eliminar tarea**: Haz clic en "Eliminar" en la tarjeta de la tarea
- **Filtrar tareas**: Usa los menús desplegables para filtrar por prioridad o estado

## API RESTful

### Autenticación

#### POST `/api/auth/register`
Registra un nuevo usuario.

**Body:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "contraseña123"
}
```

#### POST `/api/auth/login`
Inicia sesión de un usuario.

**Body:**
```json
{
  "email": "juan@example.com",
  "password": "contraseña123"
}
```

### Tareas

Todas las rutas de tareas requieren autenticación mediante el header:
```
Authorization: Bearer <token>
```

#### GET `/api/tareas`
Obtiene todas las tareas del usuario autenticado.

#### GET `/api/tareas/:id`
Obtiene una tarea específica.

#### POST `/api/tareas`
Crea una nueva tarea.

**Body:**
```json
{
  "titulo": "Completar proyecto",
  "descripcion": "Descripción de la tarea",
  "fecha_vencimiento": "2024-12-31",
  "prioridad": "alta",
  "estado": "pendiente"
}
```

#### PUT `/api/tareas/:id`
Actualiza una tarea existente.

#### DELETE `/api/tareas/:id`
Elimina una tarea.

## Esquema de Base de Datos

### Tabla: `usuarios`
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `nombre` (VARCHAR(100))
- `email` (VARCHAR(100), UNIQUE)
- `password_hash` (VARCHAR(255))
- `fecha_creacion` (TIMESTAMP)
- `fecha_actualizacion` (TIMESTAMP)

### Tabla: `tareas`
- `id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `usuario_id` (INT, FOREIGN KEY)
- `titulo` (VARCHAR(200))
- `descripcion` (TEXT)
- `fecha_vencimiento` (DATE)
- `prioridad` (ENUM: 'baja', 'media', 'alta')
- `estado` (ENUM: 'pendiente', 'en_progreso', 'completada')
- `fecha_creacion` (TIMESTAMP)
- `fecha_actualizacion` (TIMESTAMP)

## Seguridad Implementada

1. **Autenticación JWT**: Tokens seguros con expiración de 24 horas
2. **Encriptación de contraseñas**: Uso de bcrypt con salt rounds
3. **Validación de datos**: Validación en frontend y backend
4. **Protección de rutas**: Middleware de autenticación para rutas protegidas
5. **Prevención de XSS**: Escape de HTML en el frontend
6. **CORS configurado**: Control de acceso cross-origin

## Despliegue

### Opciones de Despliegue en la Nube

#### Heroku
1. Instala Heroku CLI
2. Crea una aplicación: `heroku create`
3. Configura variables de entorno en Heroku
4. Usa un addon de MySQL (ClearDB o JawsDB)
5. Despliega: `git push heroku main`

#### AWS
1. Usa AWS Elastic Beanstalk para Node.js
2. Configura RDS para MySQL
3. Configura variables de entorno en el panel de AWS
4. Despliega la aplicación

### Consideraciones para Producción
- Cambiar `JWT_SECRET` por un valor seguro y aleatorio
- Configurar HTTPS
- Usar variables de entorno para configuración sensible
- Implementar rate limiting
- Configurar logs y monitoreo

## Decisiones de Diseño

### Arquitectura
- **Separación de responsabilidades**: Frontend y backend completamente separados
- **API RESTful**: Diseño REST estándar para facilitar mantenimiento y escalabilidad
- **Base de datos relacional**: MySQL para garantizar integridad de datos

### Frontend
- **JavaScript Vanilla**: Sin frameworks para mantener el proyecto ligero y educativo
- **Diseño responsive**: Adaptable a diferentes tamaños de pantalla
- **UX moderna**: Interfaz intuitiva con feedback visual

### Backend
- **Node.js/Express**: Tecnología moderna y ampliamente utilizada
- **Middleware de autenticación**: Reutilizable y escalable
- **Validación robusta**: Validación en múltiples capas

## Próximas Mejoras Posibles

- [ ] Búsqueda de tareas por texto
- [ ] Ordenamiento de tareas
- [ ] Notificaciones de tareas próximas a vencer
- [ ] Exportación de tareas a PDF/CSV
- [ ] Categorías/etiquetas para tareas
- [ ] Compartir tareas entre usuarios
- [ ] Modo oscuro
- [ ] PWA (Progressive Web App)

## Autor

**Grupo 2 - ITLA Virtual**

## Licencia

Este proyecto fue desarrollado como parte del curso "Sistemas y Computación I" en ITLA Virtual.

---

**Nota**: Este proyecto cumple con todos los requisitos especificados en la descripción del proyecto del Grupo 2, incluyendo programación web (HTML, CSS, JavaScript), bases de datos (MySQL), backend (API RESTful), seguridad (autenticación y validación), y está preparado para despliegue en la nube.

