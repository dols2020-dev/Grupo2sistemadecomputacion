// ============================================
// JavaScript Frontend - Sistema de Gestión de Tareas
// Grupo 2 - ITLA Virtual
// ============================================

const API_BASE_URL = 'http://localhost:3000/api';

// Estado de la aplicación
let currentUser = null;
let authToken = null;
let tasks = [];
let editingTaskId = null;

// Elementos del DOM
const authSection = document.getElementById('authSection');
const tasksSection = document.getElementById('tasksSection');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const tasksList = document.getElementById('tasksList');
const emptyState = document.getElementById('emptyState');
const taskModal = document.getElementById('taskModal');
const taskForm = document.getElementById('taskForm');
const newTaskBtn = document.getElementById('newTaskBtn');
const filterPriority = document.getElementById('filterPriority');
const filterStatus = document.getElementById('filterStatus');
const clearFiltersBtn = document.getElementById('clearFiltersBtn');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Verificar autenticación
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    
    if (token && user) {
        authToken = token;
        currentUser = JSON.parse(user);
        showTasksSection();
        loadTasks();
    } else {
        showAuthSection();
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Tabs de autenticación
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = e.target.dataset.tab;
            switchTab(tab);
        });
    });

    // Formularios de autenticación
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
    logoutBtn.addEventListener('click', handleLogout);

    // Tareas
    newTaskBtn.addEventListener('submit', () => openTaskModal());
    newTaskBtn.addEventListener('click', () => openTaskModal());
    taskForm.addEventListener('submit', handleTaskSubmit);
    document.querySelector('.close').addEventListener('click', closeTaskModal);
    document.getElementById('cancelTaskBtn').addEventListener('click', closeTaskModal);

    // Filtros
    filterPriority.addEventListener('change', applyFilters);
    filterStatus.addEventListener('change', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);

    // Cerrar modal al hacer clic fuera
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) {
            closeTaskModal();
        }
    });
}

// Cambiar tab de autenticación
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });

    if (tab === 'login') {
        loginForm.classList.add('active');
    } else {
        registerForm.classList.add('active');
    }
}

// Manejar login
async function handleLogin(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('loginError');
    errorDiv.textContent = '';
    errorDiv.classList.remove('show');

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showTasksSection();
            loadTasks();
            loginForm.reset();
        } else {
            errorDiv.textContent = data.error || 'Error al iniciar sesión';
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Error de conexión. Verifica que el servidor esté corriendo.';
        errorDiv.classList.add('show');
        console.error('Error:', error);
    }
}

// Manejar registro
async function handleRegister(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('registerError');
    errorDiv.textContent = '';
    errorDiv.classList.remove('show');

    const nombre = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, email, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showTasksSection();
            loadTasks();
            registerForm.reset();
        } else {
            if (data.errors) {
                errorDiv.textContent = data.errors.map(e => e.msg).join(', ');
            } else {
                errorDiv.textContent = data.error || 'Error al registrarse';
            }
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Error de conexión. Verifica que el servidor esté corriendo.';
        errorDiv.classList.add('show');
        console.error('Error:', error);
    }
}

// Manejar logout
function handleLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    tasks = [];
    showAuthSection();
}

// Mostrar sección de autenticación
function showAuthSection() {
    authSection.style.display = 'flex';
    tasksSection.style.display = 'none';
    userInfo.style.display = 'none';
}

// Mostrar sección de tareas
function showTasksSection() {
    authSection.style.display = 'none';
    tasksSection.style.display = 'block';
    userInfo.style.display = 'flex';
    userName.textContent = currentUser.nombre;
}

// Cargar tareas
async function loadTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/tareas`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            tasks = await response.json();
            renderTasks();
        } else {
            console.error('Error al cargar tareas');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Renderizar tareas
function renderTasks() {
    const filteredTasks = getFilteredTasks();

    if (filteredTasks.length === 0) {
        tasksList.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        tasksList.style.display = 'grid';
        emptyState.style.display = 'none';
        tasksList.innerHTML = filteredTasks.map(task => createTaskCard(task)).join('');
        
        // Agregar event listeners a los botones
        document.querySelectorAll('.edit-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.dataset.taskId);
                openTaskModal(taskId);
            });
        });

        document.querySelectorAll('.delete-task-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = parseInt(e.target.dataset.taskId);
                deleteTask(taskId);
            });
        });
    }
}

// Obtener tareas filtradas
function getFilteredTasks() {
    let filtered = [...tasks];

    const priorityFilter = filterPriority.value;
    const statusFilter = filterStatus.value;

    if (priorityFilter) {
        filtered = filtered.filter(task => task.prioridad === priorityFilter);
    }

    if (statusFilter) {
        filtered = filtered.filter(task => task.estado === statusFilter);
    }

    return filtered;
}

// Aplicar filtros
function applyFilters() {
    renderTasks();
}

// Limpiar filtros
function clearFilters() {
    filterPriority.value = '';
    filterStatus.value = '';
    renderTasks();
}

// Crear tarjeta de tarea
function createTaskCard(task) {
    const dueDate = task.fecha_vencimiento 
        ? new Date(task.fecha_vencimiento).toLocaleDateString('es-ES')
        : 'Sin fecha';
    
    const isOverdue = task.fecha_vencimiento && 
        new Date(task.fecha_vencimiento) < new Date() && 
        task.estado !== 'completada';

    return `
        <div class="task-card priority-${task.prioridad} estado-${task.estado}">
            <div class="task-header">
                <h3 class="task-title">${escapeHtml(task.titulo)}</h3>
            </div>
            ${task.descripcion ? `<p class="task-description">${escapeHtml(task.descripcion)}</p>` : ''}
            <div class="task-meta">
                <span class="task-badge badge-priority ${task.prioridad}">Prioridad: ${task.prioridad.toUpperCase()}</span>
                <span class="task-badge badge-status ${task.estado}">${getStatusLabel(task.estado)}</span>
                ${isOverdue ? '<span class="task-badge" style="background-color: #fee2e2; color: #991b1b;">Vencida</span>' : ''}
            </div>
            <div class="task-date">
                📅 Vence: ${dueDate}
            </div>
            <div class="task-actions">
                <button class="btn btn-primary btn-sm edit-task-btn" data-task-id="${task.id}">Editar</button>
                <button class="btn btn-danger btn-sm delete-task-btn" data-task-id="${task.id}">Eliminar</button>
            </div>
        </div>
    `;
}

// Obtener etiqueta de estado
function getStatusLabel(estado) {
    const labels = {
        'pendiente': 'Pendiente',
        'en_progreso': 'En Progreso',
        'completada': 'Completada'
    };
    return labels[estado] || estado;
}

// Abrir modal de tarea
function openTaskModal(taskId = null) {
    editingTaskId = taskId;
    const modalTitle = document.getElementById('modalTitle');
    const errorDiv = document.getElementById('taskError');
    errorDiv.textContent = '';
    errorDiv.classList.remove('show');

    if (taskId) {
        modalTitle.textContent = 'Editar Tarea';
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.titulo;
            document.getElementById('taskDescription').value = task.descripcion || '';
            document.getElementById('taskDueDate').value = task.fecha_vencimiento || '';
            document.getElementById('taskPriority').value = task.prioridad;
            document.getElementById('taskStatus').value = task.estado;
        }
    } else {
        modalTitle.textContent = 'Nueva Tarea';
        taskForm.reset();
        document.getElementById('taskId').value = '';
    }

    taskModal.classList.add('show');
}

// Cerrar modal de tarea
function closeTaskModal() {
    taskModal.classList.remove('show');
    taskForm.reset();
    editingTaskId = null;
}

// Manejar envío de formulario de tarea
async function handleTaskSubmit(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('taskError');
    errorDiv.textContent = '';
    errorDiv.classList.remove('show');

    const taskData = {
        titulo: document.getElementById('taskTitle').value,
        descripcion: document.getElementById('taskDescription').value,
        fecha_vencimiento: document.getElementById('taskDueDate').value || null,
        prioridad: document.getElementById('taskPriority').value,
        estado: document.getElementById('taskStatus').value
    };

    try {
        const url = editingTaskId 
            ? `${API_BASE_URL}/tareas/${editingTaskId}`
            : `${API_BASE_URL}/tareas`;
        
        const method = editingTaskId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(taskData)
        });

        const data = await response.json();

        if (response.ok) {
            closeTaskModal();
            loadTasks();
        } else {
            if (data.errors) {
                errorDiv.textContent = data.errors.map(e => e.msg).join(', ');
            } else {
                errorDiv.textContent = data.error || 'Error al guardar la tarea';
            }
            errorDiv.classList.add('show');
        }
    } catch (error) {
        errorDiv.textContent = 'Error de conexión';
        errorDiv.classList.add('show');
        console.error('Error:', error);
    }
}

// Eliminar tarea
async function deleteTask(taskId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/tareas/${taskId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            loadTasks();
        } else {
            const data = await response.json();
            alert(data.error || 'Error al eliminar la tarea');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión');
    }
}

// Escapar HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

