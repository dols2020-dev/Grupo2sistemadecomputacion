// ============================================
// Servidor Backend - API RESTful (SQLite)
// Sistema de Gestión de Tareas Web - Grupo 2
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secreto_super_seguro';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============================================
// CONEXIÓN A SQLITE
// ============================================

const db = new sqlite3.Database('./database/tareas.db', (err) => {
    if (err) console.error('Error al conectar SQLite:', err);
    else console.log('SQLite conectado correctamente');
});

// ============================================
// CREACIÓN DE TABLAS
// ============================================

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS tareas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            titulo TEXT NOT NULL,
            descripcion TEXT,
            fecha_vencimiento TEXT,
            prioridad TEXT NOT NULL DEFAULT 'media',
            estado TEXT NOT NULL DEFAULT 'pendiente',
            fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    `);
});

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================

const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Token requerido' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch {
        return res.status(403).json({ error: 'Token inválido' });
    }
};

// ============================================
// REGISTRO DE USUARIO
// ============================================

app.post('/api/auth/register', [
    body('nombre').trim().isLength({ min: 2 }),
    body('email').isEmail(),
    body('password').isLength({ min: 6 })
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nombre, email, password } = req.body;

    const passwordHash = bcrypt.hashSync(password, 10);

    db.run(
        `INSERT INTO usuarios (nombre, email, password_hash) VALUES (?, ?, ?)`,
        [nombre, email, passwordHash],
        function (err) {
            if (err) return res.status(400).json({ error: 'El email ya está registrado' });

            const token = jwt.sign({ userId: this.lastID }, JWT_SECRET, { expiresIn: '24h' });

            res.status(201).json({
                message: 'Usuario registrado exitosamente',
                token,
                user: { id: this.lastID, nombre, email }
            });
        }
    );
});

// ============================================
// LOGIN
// ============================================

app.post('/api/auth/login', [
    body('email').isEmail(),
    body('password').notEmpty()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    db.get(
        `SELECT * FROM usuarios WHERE email = ?`,
        [email],
        (err, user) => {
            if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

            const valid = bcrypt.compareSync(password, user.password_hash);
            if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

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
        }
    );
});

// ============================================
// OBTENER TAREAS
// ============================================

app.get('/api/tareas', authenticateToken, (req, res) => {
    db.all(
        `
        SELECT id, titulo, descripcion, fecha_vencimiento, prioridad, estado,
               fecha_creacion, fecha_actualizacion
        FROM tareas
        WHERE usuario_id = ?
        ORDER BY fecha_creacion DESC
        `,
        [req.userId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Error al obtener tareas' });
            res.json(rows);
        }
    );
});

// ============================================
// OBTENER UNA TAREA
// ============================================

app.get('/api/tareas/:id', authenticateToken, (req, res) => {
    db.get(
        `
        SELECT *
        FROM tareas
        WHERE id = ? AND usuario_id = ?
        `,
        [req.params.id, req.userId],
        (err, task) => {
            if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
            res.json(task);
        }
    );
});

// ============================================
// CREAR TAREA
// ============================================

app.post('/api/tareas', authenticateToken, [
    body('titulo').notEmpty(),
    body('prioridad').isIn(['baja', 'media', 'alta']),
    body('estado').optional().isIn(['pendiente', 'en_progreso', 'completada'])
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { titulo, descripcion, fecha_vencimiento, prioridad, estado } = req.body;

    db.run(
        `
        INSERT INTO tareas (usuario_id, titulo, descripcion, fecha_vencimiento, prioridad, estado)
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [req.userId, titulo, descripcion, fecha_vencimiento, prioridad, estado || 'pendiente'],
        function (err) {
            if (err) return res.status(500).json({ error: 'Error al crear tarea' });

            db.get(
                `SELECT * FROM tareas WHERE id = ?`,
                [this.lastID],
                (err2, task) => res.status(201).json(task)
            );
        }
    );
});

// ============================================
// ACTUALIZAR TAREA
// ============================================

app.put('/api/tareas/:id', authenticateToken, (req, res) => {
    const { titulo, descripcion, fecha_vencimiento, prioridad, estado } = req.body;

    db.run(
        `
        UPDATE tareas
        SET titulo=?, descripcion=?, fecha_vencimiento=?, prioridad=?, estado=?, fecha_actualizacion=CURRENT_TIMESTAMP
        WHERE id=? AND usuario_id=?
        `,
        [titulo, descripcion, fecha_vencimiento, prioridad, estado, req.params.id, req.userId],
        function (err) {
            if (err) return res.status(500).json({ error: 'Error al actualizar tarea' });
            res.json({ message: 'Tarea actualizada' });
        }
    );
});

// ============================================
// ELIMINAR TAREA
// ============================================

app.delete('/api/tareas/:id', authenticateToken, (req, res) => {
    db.run(
        `DELETE FROM tareas WHERE id = ? AND usuario_id = ?`,
        [req.params.id, req.userId],
        function (err) {
            if (err) return res.status(500).json({ error: 'Error al eliminar tarea' });
            res.json({ message: 'Tarea eliminada exitosamente' });
        }
    );
});

// ============================================
// SERVIR FRONTEND
// ============================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});
