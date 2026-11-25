// ===== Conexión con el backend (Spring Boot) =====
const API = 'http://localhost:8080/api/tasks';
const API_NOTAS = 'http://localhost:8080/api/notes';

// Backend -> formato que usa este frontend
const aFront = t => ({ ...t, asignado: t.asignadoA, fecha: t.fechaEntrega });
// Frontend -> formato que espera el backend
const aBack = t => ({
    nombre: t.nombre,
    descripcion: t.descripcion,
    asignadoA: t.asignado,
    fechaEntrega: t.fecha,
    estado: t.estado
});

async function api(url, metodo = 'GET', cuerpo) {
    try {
        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: cuerpo && JSON.stringify(url.startsWith(API) ? aBack(cuerpo) : cuerpo)
        });
        if (res.status === 204) return true;
        const datos = await res.json();
        if (res.ok) return Array.isArray(datos) ? datos.map(aFront) : aFront(datos);
        alert(datos.errores ? Object.values(datos.errores).join('\n') : datos.mensaje);
    } catch (e) {
        alert('No se pudo conectar con el servidor');
    }
}

class TaskManager {
    constructor() {
        this.tasks = [];
    }

    getAllTasks() {
        return this.tasks;
    }

    getTasksWithStatus(status) {
        return this.tasks.filter(task => task.estado === status);
    }

    getTaskById(taskId) {
        let foundTask = null;
        for (let i = 0; i < this.tasks.length; i++) {
            if (this.tasks[i].id === taskId) {
                foundTask = this.tasks[i];
                break;
            }
        }
        return foundTask;
    }

    async cargar() {
        this.tasks = (await api(API)) || [];
    }

    async addTask(nombre, descripcion, asignadoA, fechaDeEntrega, estado) {
        const t = await api(API, 'POST', { nombre, descripcion, asignado: asignadoA, fecha: fechaDeEntrega, estado });
        if (t) this.tasks.push(t);
        renderizarTareas();
        renderizarCalendario();
    }

    async deleteTask(taskId) {
        if (await api(`${API}/${taskId}`, 'DELETE')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
        }
        renderizarTareas();
        renderizarCalendario();
    }

    async updateTask(taskId, status) {
        const t = this.getTaskById(taskId);
        if (!t) return;
        // Al marcar HECHO se recuerda el estado anterior; al desmarcar se restaura
        const previo = status === 'HECHO' ? t.estado : t.estadoPrevio;
        if (status === 'PENDIENTE' && previo) status = previo;
        const nueva = await api(`${API}/${taskId}`, 'PUT', { ...t, estado: status });
        if (nueva) Object.assign(t, nueva, { estadoPrevio: previo });
        renderizarTareas();
        renderizarCalendario();
    }
}

// Instancias y variables globales
const gestorTareas = new TaskManager();
let idEditando = null;
let listaNotas = [];
let filtroActual = 'todas';
let busquedaActual = '';
let anioActual = new Date().getFullYear();
let mesActual = new Date().getMonth();
let fechaSeleccionadaCalendario = new Date().toISOString().split('T')[0];

window.addEventListener('DOMContentLoaded', async () => {
    await gestorTareas.cargar();
    listaNotas = (await api(API_NOTAS)) || [];
    iniciarParticulas();
    renderizarTareas();
    renderizarCalendario();
    renderizarNotas();
    document.getElementById('fecha-tarea').value = fechaSeleccionadaCalendario;

    // Si ya hay un nombre guardado, saludar y omitir el modal de bienvenida
    const nombreGuardado = localStorage.getItem('nombreUsuario');
    if (nombreGuardado) {
        document.getElementById('titulo-bienvenida').innerText = `¡Hola, ${nombreGuardado}!`;
        document.getElementById('modal-nombre').classList.add('oculto');
    }

    // Escuchar clics en la lista de tareas mediante delegación de eventos
    const contenedorTareas = document.getElementById('contenedor-tareas');
    if (contenedorTareas) {
        contenedorTareas.addEventListener('click', (event) => {
            const botonCompletar = event.target.closest('.casilla-tarea');
            if (botonCompletar) {
                const tarjetaElemento = event.target.closest('.tarjeta-tarea');
                if (tarjetaElemento) {
                    const taskId = Number(tarjetaElemento.dataset.taskId);
                    const tarea = gestorTareas.getTaskById(taskId);
                    if (tarea) {
                        const nuevoEstado = (tarea.estado === 'HECHO') ? 'PENDIENTE' : 'HECHO';
                        gestorTareas.updateTask(taskId, nuevoEstado);
                    }
                }
            }
        });
    }
});

// Función para capturar el nombre del modal inicial y actualizar el banner
function guardarNombreUsuario(evento) {
    evento.preventDefault();
    const inputNombre = document.getElementById('input-nombre-usuario').value;

    if (inputNombre && inputNombre.trim() !== "") {
        const nombreLimpio = inputNombre.trim();
        localStorage.setItem('nombreUsuario', nombreLimpio);
        location.reload(); // recarga para mostrar las tarjetas guardadas
        return;
        // Actualiza el banner con el formato solicitado
        document.getElementById('titulo-bienvenida').innerText = `¡Hola, ${nombreLimpio}!`;
        document.getElementById('subtitulo-conteo').innerText = `Bienvenido a tu planificador. Administra, valida y elimina tus tareas.`;

        // Ocultar modal de bienvenida
        document.getElementById('modal-nombre').classList.add('oculto');
    }
}

// Validación de formulario
function validateTaskForm(nombre, descripcion, asignadoA, fechaDeEntrega, estado) {
    let esValido = true;
    limpiarErroresFormulario();

    if (!nombre || nombre.trim().length <= 8) {
        document.getElementById('error-nombre').innerText = "El nombre debe tener más de 8 caracteres.";
        esValido = false;
    }
    if (!descripcion || descripcion.trim().length <= 15) {
        document.getElementById('error-descripcion').innerText = "La descripción debe tener más de 15 caracteres.";
        esValido = false;
    }
    if (!asignadoA || asignadoA.trim().length <= 8) {
        document.getElementById('error-asignado').innerText = "El campo asignado debe tener más de 8 caracteres.";
        esValido = false;
    }
    if (!fechaDeEntrega || fechaDeEntrega.trim() === "") {
        document.getElementById('error-fecha').innerText = "Selecciona una fecha de entrega válida.";
        esValido = false;
    } else {
        const hoyStr = new Date().toISOString().split('T')[0];
        if (fechaDeEntrega < hoyStr) {
            document.getElementById('error-fecha').innerText = "No se pueden añadir tareas con fecha anterior a la actual.";
            esValido = false;
        }
    }
    if (!estado || estado.trim() === "") {
        document.getElementById('error-estado').innerText = "Debes seleccionar un estado.";
        esValido = false;
    }

    return esValido;
}

function manejarEnvioFormulario(evento) {
    evento.preventDefault();

    const nombre = document.getElementById('nombre-tarea').value;
    const descripcion = document.getElementById('descripcion-tarea').value;
    const asignadoA = document.getElementById('asignado-tarea').value;
    const fechaDeEntrega = document.getElementById('fecha-tarea').value;
    const estado = document.getElementById('estado-tarea').value;

    if (!validateTaskForm(nombre, descripcion, asignadoA, fechaDeEntrega, estado)) {
        return;
    }

    if (idEditando !== null) {
        const t = gestorTareas.getTaskById(idEditando);
        api(`${API}/${idEditando}`, 'PUT', { ...t, nombre, descripcion, asignado: asignadoA, fecha: fechaDeEntrega, estado })
            .then(nueva => {
                if (nueva) {
                    Object.assign(t, nueva);
                    renderizarTareas();
                    renderizarCalendario();
                }
            });
        idEditando = null;
    } else {
        gestorTareas.addTask(nombre, descripcion, asignadoA, fechaDeEntrega, estado);
    }

    document.getElementById('formulario-tarea').reset();
    limpiarErroresFormulario();
    cerrarModal();

    renderizarTareas();
    renderizarCalendario();
}

function limpiarErroresFormulario() {
    document.getElementById('error-nombre').innerText = "";
    document.getElementById('error-descripcion').innerText = "";
    document.getElementById('error-asignado').innerText = "";
    document.getElementById('error-fecha').innerText = "";
    document.getElementById('error-estado').innerText = "";
}

function renderizarTareas() {
    const contenedor = document.getElementById('contenedor-tareas');
    if(!contenedor) return;

    contenedor.innerHTML = '';

    let listaTareas = gestorTareas.getAllTasks();
    let filtradas = listaTareas.filter(tarea => {
        const cumpleFiltro = filtroActual === 'todas' || tarea.estado === filtroActual;
        const cumpleBusqueda = (tarea.nombre || '').toLowerCase().includes(busquedaActual.toLowerCase()) ||
                             (tarea.descripcion || '').toLowerCase().includes(busquedaActual.toLowerCase());
        return cumpleFiltro && cumpleBusqueda;
    });

    if(filtradas.length === 0) {
        contenedor.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--texto-secundario); font-size: 0.85rem;">No se encontraron tareas con los filtros actuales.</div>`;
        return;
    }

    contenedor.innerHTML = filtradas.map(tarea => {
        const estaCompletada = tarea.estado === 'HECHO' || tarea.estado === 'FINALIZADO';
        const estadoFormateado = tarea.estado.replace(' ', '-');
        return `
            <div class="tarjeta-tarea" id="task-card-${tarea.id}" data-task-id="${tarea.id}">
                <div class="info-principal-tarea">
                    <button type="button" class="casilla-tarea ${estaCompletada ? 'completada' : ''}" title="Marcar como hecha">
                        ${estaCompletada ? '✓' : ''}
                    </button>
                    <div>
                        <h4 class="titulo-tarea ${estaCompletada ? 'tachado' : ''}">${tarea.nombre} </h4>
                        <p class="descripcion-tarea">${tarea.descripcion}</p>
                        <div class="etiquetas-tarea">
                            <span class="etiqueta badge-${estadoFormateado}">${tarea.estado}</span>
                            <span class="etiqueta badge-info">Responsable: ${tarea.asignado}</span>
                            <span class="etiqueta badge-info">Fecha entrega: ${tarea.fecha}</span>
                        </div>
                    </div>
                </div>
                <div class="acciones-tarea">
                    <button onclick="editarTarea(${tarea.id})" class="btn-accion" title="Editar">
                        <img src="multimedia/pencil.svg" alt="Editar">
                    </button>
                    <button onclick="eliminarTarea(${tarea.id})" class="btn-accion" title="Eliminar">
                        <img src="multimedia/trash3-fill.svg" alt="Eliminar">
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function eliminarTarea(id) {
    if (confirm("¿Estás seguro de que deseas eliminar esta tarea?")) {
        gestorTareas.deleteTask(id);
    }
}

function editarTarea(id) {
    abrirModal(id);
}

function filtrarTareas(filtro) {
    filtroActual = filtro;
    document.querySelectorAll('.chip-filtro').forEach(chip => {
        chip.classList.toggle('activo', chip.dataset.filtro === filtro);
    });
    renderizarTareas();
}

// Calendario Interactivo
const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function renderizarCalendario() {
    const titulo = document.getElementById('titulo-mes-calendario');
    const rejilla = document.getElementById('rejilla-calendario');
    if(!titulo || !rejilla) return;

    titulo.innerText = `${nombresMeses[mesActual]} ${anioActual}`;
    const indicePrimerDia = (new Date(anioActual, mesActual, 1).getDay() + 6) % 7;
    const totalDiasMes = new Date(anioActual, mesActual + 1, 0).getDate();
    const listaTareas = gestorTareas.getAllTasks();

    let html = '';
    for(let i = 0; i < indicePrimerDia; i++) {
        html += `<div class="dia-calendario" style="opacity: 0.2; pointer-events: none;"></div>`;
    }

    for(let dia = 1; dia <= totalDiasMes; dia++) {
        const mesStr = String(mesActual + 1).padStart(2, '0');
        const diaStr = String(dia).padStart(2, '0');
        const cadenaFecha = `${anioActual}-${mesStr}-${diaStr}`;
        const tareasDelDia = listaTareas.filter(t => t.fecha === cadenaFecha);
        const estaSeleccionado = fechaSeleccionadaCalendario === cadenaFecha;

        html += `
            <div onclick="seleccionarFechaCalendario('${cadenaFecha}')" class="dia-calendario ${estaSeleccionado ? 'seleccionado' : ''}">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="numero-dia">${dia}</span>
                    ${tareasDelDia.length > 0 ? `<span class="conteo-dia">${tareasDelDia.length}</span>` : ''}
                </div>
                <div>
                    ${tareasDelDia.slice(0, 1).map(t => `<div class="tarea-miniatura-calendario">${t.nombre}</div>`).join('')}
                </div>
            </div>
        `;
    }
    rejilla.innerHTML = html;
    renderizarTareasDiaSeleccionado();
}

function cambiarMes(direccion) {
    mesActual += direccion;
    if(mesActual > 11) { mesActual = 0; anioActual++; }
    if(mesActual < 0) { mesActual = 11; anioActual--; }
    renderizarCalendario();
}

function irMesActual() {
    anioActual = new Date().getFullYear();
    mesActual = new Date().getMonth();
    renderizarCalendario();
}

function seleccionarFechaCalendario(cadenaFecha) {
    fechaSeleccionadaCalendario = cadenaFecha;
    renderizarCalendario();
    document.getElementById('fecha-tarea').value = cadenaFecha;
}

function renderizarTareasDiaSeleccionado() {
    const titulo = document.getElementById('titulo-dia-seleccionado');
    const contenedor = document.getElementById('tareas-dia-seleccionado');
    if(!titulo || !contenedor) return;

    titulo.innerText = `Tareas para el ${fechaSeleccionadaCalendario}`;
    const listaTareas = gestorTareas.getAllTasks();
    const tareasDia = listaTareas.filter(t => t.fecha === fechaSeleccionadaCalendario);

    if(tareasDia.length === 0) {
        contenedor.innerHTML = `<p style="font-size: 0.8rem; color: var(--texto-secundario);">No hay tareas programadas para esta fecha.</p>`;
        return;
    }

    contenedor.innerHTML = tareasDia.map(tarea => `
        <div style="background: var(--fondo-tarjeta); padding: 12px; border-radius: 12px; border: 1px solid var(--color-borde); display: flex; justify-content: space-between; align-items: center;">
            <div>
                <div style="font-size: 0.85rem; font-weight: 600;">${tarea.nombre}</div>
                <div style="font-size: 0.7rem; color: var(--texto-secundario);">${tarea.estado} • ${tarea.asignado}</div>
            </div>
            <button onclick="gestorTareas.updateTask(${tarea.id}, '${tarea.estado === 'HECHO' ? 'PENDIENTE' : 'HECHO'}')" class="btn-secundario" style="padding: 4px 10px; font-size: 0.75rem;">${tarea.estado === 'HECHO' ? 'Reabrir' : 'Completar'}</button>
        </div>
    `).join('');
}

// Bloc de Notas
function renderizarNotas() {
    const contenedor = document.getElementById('contenedor-notas');
    if(!contenedor) return;

    if(listaNotas.length === 0) {
        contenedor.innerHTML = `<p style="font-size: 0.85rem; color: var(--texto-secundario);">No hay notas guardadas.</p>`;
        return;
    }

    contenedor.innerHTML = listaNotas.map(nota => `
        <div class="tarjeta-nota">
            <p>${nota.texto}</p>
            <button onclick="eliminarNota(${nota.id})" class="eliminar-nota">Eliminar</button>
        </div>
    `).join('');
}

async function manejarEnvioNota(evento) {
    evento.preventDefault();
    const texto = document.getElementById('texto-nota').value;
    if (texto.trim() !== "") {
        const nota = await api(API_NOTAS, 'POST', { texto });
        if (nota) {
            listaNotas.push(nota);
            document.getElementById('formulario-nota').reset();
            cerrarModalNota();
            renderizarNotas();
        }
    }
}

async function eliminarNota(id) {
    if (await api(`${API_NOTAS}/${id}`, 'DELETE')) {
        listaNotas = listaNotas.filter(n => n.id !== id);
        renderizarNotas();
    }
}

// Navegación y Modales
function cambiarPestana(pestana) {
    document.getElementById('vista-hoy').classList.toggle('oculto', pestana !== 'hoy');
    document.getElementById('vista-calendario').classList.toggle('oculto', pestana !== 'calendario');
    document.getElementById('vista-notas').classList.toggle('oculto', pestana !== 'notas');

    document.getElementById('btn-pestana-hoy').classList.toggle('activo', pestana === 'hoy');
    document.getElementById('btn-pestana-calendario').classList.toggle('activo', pestana === 'calendario');
    document.getElementById('btn-pestana-notas').classList.toggle('activo', pestana === 'notas');

    if(pestana === 'calendario') renderizarCalendario();
    if(pestana === 'notas') renderizarNotas();
}

function alternarModoOscuro() {
    document.body.classList.toggle('oscuro');
    const btnIcono = document.querySelector('.btn-icono');
    btnIcono.innerHTML = document.body.classList.contains('oscuro')
        ? '<img src="multimedia/sun-fill.svg" alt="Sol">'
        : '<img src="multimedia/moon-stars.svg" alt="Luna">';
}

function abrirModal(idEdicion = null) {
    limpiarErroresFormulario();
    document.getElementById('formulario-tarea').reset();
    document.getElementById('modal-tarea').classList.remove('oculto');
    document.getElementById('fecha-tarea').value = fechaSeleccionadaCalendario;

    idEditando = idEdicion;
    document.getElementById('titulo-modal').innerText = idEdicion ? 'Editar Tarea' : 'Nueva Tarea';
    if (idEdicion) {
        const t = gestorTareas.getTaskById(idEdicion);
        document.getElementById('nombre-tarea').value = t.nombre;
        document.getElementById('descripcion-tarea').value = t.descripcion;
        document.getElementById('asignado-tarea').value = t.asignado;
        document.getElementById('fecha-tarea').value = t.fecha;
        document.getElementById('estado-tarea').value = t.estado;
    }
}

function cerrarModal() {
    document.getElementById('modal-tarea').classList.add('oculto');
}

function abrirModalNota() {
    document.getElementById('formulario-nota').reset();
    document.getElementById('modal-nota').classList.remove('oculto');
}

function cerrarModalNota() {
    document.getElementById('modal-nota').classList.add('oculto');
}

// Animación de partículas
function iniciarParticulas() {
    const lienzo = document.getElementById('lienzo-particulas');
    if (!lienzo) return;
    const ctx = lienzo.getContext('2d');

    let ancho = lienzo.width = window.innerWidth;
    let alto = lienzo.height = window.innerHeight;

    window.addEventListener('resize', () => {
        ancho = lienzo.width = window.innerWidth;
        alto = lienzo.height = window.innerHeight;
    });

    const particulas = Array.from({ length: 35 }, () => ({
        x: Math.random() * ancho,
        y: Math.random() * alto,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radio: Math.random() * 2.5 + 1.2
    }));

    function bucle() {
        ctx.clearRect(0, 0, ancho, alto);
        const oscuro = document.body.classList.contains('oscuro');
        ctx.fillStyle = oscuro ? 'rgba(139, 92, 246, 0.45)' : 'rgba(91, 33, 182, 0.35)';

        particulas.forEach((p, indice) => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > ancho) p.vx *= -1;
            if (p.y < 0 || p.y > alto) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radio, 0, Math.PI * 2);
            ctx.fill();

            for (let j = indice + 1; j < particulas.length; j++) {
                const p2 = particulas[j];
                const distancia = Math.hypot(p.x - p2.x, p.y - p2.y);
                if (distancia < 120) {
                    ctx.strokeStyle = oscuro ? `rgba(139, 92, 246, ${0.25 * (1 - distancia/120)})` : `rgba(91, 33, 182, ${0.18 * (1 - distancia/120)})`;
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        });
        requestAnimationFrame(bucle);
    }
    bucle();
}
