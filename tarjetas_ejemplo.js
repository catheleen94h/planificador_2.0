// Datos de ejemplo para el planificador: guarda 10 tareas y 5 notas en localStorage.
// Uso: ejecútalo UNA vez (ver instrucciones) y luego refresca la página.

const tareasEjemplo = [
    { id: 1,  nombre: "Diseñar la interfaz de usuario", descripcion: "Crear los mockups de las pantallas principales en Figma.", asignado: "Lucas Ramírez", fecha: "2026-11-24", estado: "PENDIENTE" },
    { id: 2,  nombre: "Configurar base de datos MySQL", descripcion: "Crear las tablas de usuarios y tareas con sus relaciones.", asignado: "Diana Hinestroza", fecha: "2026-11-25", estado: "EN PROCESO" },
    { id: 3,  nombre: "Implementar endpoints REST", descripcion: "Desarrollar el CRUD de tareas con Spring Boot y probarlo.", asignado: "Diana Hinestroza", fecha: "2026-11-26", estado: "EN PROCESO" },
    { id: 4,  nombre: "Revisar pruebas unitarias", descripcion: "Verificar que los tests de JUnit cubran los casos principales.", asignado: "Camila Torres", fecha: "2026-11-27", estado: "REVISIÓN" },
    { id: 5,  nombre: "Documentar el README del proyecto", descripcion: "Explicar la instalación, el uso y las tecnologías empleadas.", asignado: "Andrés Gómez", fecha: "2026-11-28", estado: "PENDIENTE" },
    { id: 6,  nombre: "Subir proyecto a GitHub Pages", descripcion: "Publicar la versión final del planificador en línea.", asignado: "Lucas Ramírez", fecha: "2026-11-30", estado: "PENDIENTE" },
    { id: 7,  nombre: "Corregir errores del formulario", descripcion: "Ajustar las validaciones de nombre, descripción y fecha.", asignado: "Camila Torres", fecha: "2026-11-23", estado: "HECHO" },
    { id: 8,  nombre: "Preparar presentación del sprint", descripcion: "Armar las diapositivas con los avances y demostración.", asignado: "Andrés Gómez", fecha: "2026-12-01", estado: "REVISIÓN" },
    { id: 9,  nombre: "Optimizar estilos responsivos", descripcion: "Mejorar la vista en celulares y tabletas con media queries.", asignado: "Diana Hinestroza", fecha: "2026-12-02", estado: "EN PROCESO" },
    { id: 10, nombre: "Reunión de retrospectiva Scrum", descripcion: "Analizar qué salió bien y qué mejorar en el próximo sprint.", asignado: "Equipo completo", fecha: "2026-12-03", estado: "HECHO" }
];

const notasEjemplo = [
    { id: 1, texto: "Recordar actualizar las credenciales de la API antes del despliegue del viernes." },
    { id: 2, texto: "Ideas para optimizar la interfaz de usuario." },
    { id: 3, texto: "Preguntar al equipo si usamos Angular o JavaScript puro para el front." },
    { id: 4, texto: "Repasar conceptos de inyección de dependencias para la entrevista." },
    { id: 5, texto: "Hacer backup del repositorio antes de unir las ramas." }
];

localStorage.setItem('tasks', JSON.stringify(tareasEjemplo));
localStorage.setItem('nextId', tareasEjemplo.length + 1);
localStorage.setItem('notas', JSON.stringify(notasEjemplo));