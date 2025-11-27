// ============================================
// Servidor Backend - API RESTful
// Sistema de Gestión de Tareas Web
// Grupo 2 - ITLA Virtual
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tu_secreto_jwt_muy_seguro_cambiar_en_produccion';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'task_manager_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Middleware de autenticación
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido o expirado' });
    }
};


// Registro de usuario
app.post('/api/auth/register', [
    body('nombre').trim().isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, email, password } = req.body;

    try {
        // Verificar si el email ya existe
        const [existingUsers] = await pool.execute(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Hash de la contraseña
        const passwordHash = await bcrypt.hash(password, 10);

        // Insertar nuevo usuario
        const [result] = await pool.execute(
            'INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)',
            [nombre, email, passwordHash]
        );

        // Generar token JWT
        const token = jwt.sign({ userId: result.insertId }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: {
                id: result.insertId,
                nombre,
                email
            }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
    }
});

// Login de usuario
app.post('/api/auth/login', [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Buscar usuario
        const [users] = await pool.execute(
            'SELECT id, nombre, email, password_hash FROM usuarios WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = users[0];

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Generar token JWT
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión', detail: error.message });
    }
});

// ============================================
// RUTAS DE TAREAS (CRUD)
// ============================================

// Obtener todas las tareas del usuario autenticado
app.get('/api/tareas', authenticateToken, async (req, res) => {
    try {
        const [tareas] = await pool.execute(
            `SELECT id, titulo, descripcion, fecha_vencimiento, prioridad, estado, 
             fecha_creacion, fecha_actualizacion 
             FROM tareas WHERE usuario_id = ? ORDER BY fecha_creacion DESC`,
            [req.userId]
        );

        res.json(tareas);
    } catch (error) {
        console.error('Error al obtener tareas:', error);
        res.status(500).json({ error: 'Error al obtener tareas' });
    }
});

// Obtener una tarea específica
app.get('/api/tareas/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const [tareas] = await pool.execute(
            `SELECT id, titulo, descripcion, fecha_vencimiento, prioridad, estado, 
             fecha_creacion, fecha_actualizacion 
             FROM tareas WHERE id = ? AND usuario_id = ?`,
            [id, req.userId]
        );

        if (tareas.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        res.json(tareas[0]);
    } catch (error) {
        console.error('Error al obtener tarea:', error);
        res.status(500).json({ error: 'Error al obtener tarea' });
    }
});

// Crear nueva tarea
app.post('/api/tareas', authenticateToken, [
    body('titulo').trim().isLength({ min: 1 }).withMessage('El título es requerido'),
    body('prioridad').isIn(['baja', 'media', 'alta']).withMessage('Prioridad inválida'),
    body('estado').optional().isIn(['pendiente', 'en_progreso', 'completada']).withMessage('Estado inválido'),
    body('fecha_vencimiento').optional().isISO8601().withMessage('Fecha inválida')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { titulo, descripcion, fecha_vencimiento, prioridad, estado } = req.body;

    try {
        const [result] = await pool.execute(
            `INSERT INTO tareas (usuario_id, titulo, descripcion, fecha_vencimiento, prioridad, estado) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.userId, titulo, descripcion || null, fecha_vencimiento || null, prioridad || 'media', estado || 'pendiente']
        );

        const [tareas] = await pool.execute(
            `SELECT id, titulo, descripcion, fecha_vencimiento, prioridad, estado, 
             fecha_creacion, fecha_actualizacion 
             FROM tareas WHERE id = ?`,
            [result.insertId]
        );

        res.status(201).json(tareas[0]);
    } catch (error) {
        console.error('Error al crear tarea:', error);
        res.status(500).json({ error: 'Error al crear tarea' });
    }
});

// Actualizar tarea
app.put('/api/tareas/:id', authenticateToken, [
    body('titulo').optional().trim().isLength({ min: 1 }).withMessage('El título no puede estar vacío'),
    body('prioridad').optional().isIn(['baja', 'media', 'alta']).withMessage('Prioridad inválida'),
    body('estado').optional().isIn(['pendiente', 'en_progreso', 'completada']).withMessage('Estado inválido'),
    body('fecha_vencimiento').optional().isISO8601().withMessage('Fecha inválida')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { titulo, descripcion, fecha_vencimiento, prioridad, estado } = req.body;

    try {
        // Verificar que la tarea pertenece al usuario
        const [existingTasks] = await pool.execute(
            'SELECT id FROM tareas WHERE id = ? AND usuario_id = ?',
            [id, req.userId]
        );

        if (existingTasks.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        // Construir query de actualización dinámicamente
        const updates = [];
        const values = [];

        if (titulo !== undefined) {
            updates.push('titulo = ?');
            values.push(titulo);
        }
        if (descripcion !== undefined) {
            updates.push('descripcion = ?');
            values.push(descripcion);
        }
        if (fecha_vencimiento !== undefined) {
            updates.push('fecha_vencimiento = ?');
            values.push(fecha_vencimiento || null);
        }
        if (prioridad !== undefined) {
            updates.push('prioridad = ?');
            values.push(prioridad);
        }
        if (estado !== undefined) {
            updates.push('estado = ?');
            values.push(estado);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        values.push(id, req.userId);

        await pool.execute(
            `UPDATE tareas SET ${updates.join(', ')} WHERE id = ? AND usuario_id = ?`,
            values
        );

        const [tareas] = await pool.execute(
            `SELECT id, titulo, descripcion, fecha_vencimiento, prioridad, estado, 
             fecha_creacion, fecha_actualizacion 
             FROM tareas WHERE id = ?`,
            [id]
        );

        res.json(tareas[0]);
    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        res.status(500).json({ error: 'Error al actualizar tarea' });
    }
});

// Eliminar tarea
app.delete('/api/tareas/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        // Verificar que la tarea pertenece al usuario
        const [existingTasks] = await pool.execute(
            'SELECT id FROM tareas WHERE id = ? AND usuario_id = ?',
            [id, req.userId]
        );

        if (existingTasks.length === 0) {
            return res.status(404).json({ error: 'Tarea no encontrada' });
        }

        await pool.execute('DELETE FROM tareas WHERE id = ? AND usuario_id = ?', [id, req.userId]);

        res.json({ message: 'Tarea eliminada exitosamente' });
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        res.status(500).json({ error: 'Error al eliminar tarea' });
    }
});

// Ruta para servir la aplicación frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Base de datos: ${dbConfig.database}`);
});

