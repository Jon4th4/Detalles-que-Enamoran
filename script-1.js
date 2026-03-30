/* ═══════════════════════════════════════════════════════════
   DETALLES QUE ENAMORAN — script.js
   Correcciones:
   · Todas las funciones declaradas antes de usarse
   · toLocaleString con locale explícito ('es-CU')
   · Animación fadeUp se resetea correctamente al filtrar
   · Contador de productos actualizado en cada filtro
   · Sidebar: aria-expanded sincronizado con estado
   · Escape cierra sidebar
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ── Estado global ─────────────────────────────────────────────
let productosData = [];

// ── Elementos del DOM ─────────────────────────────────────────
const sidebar      = document.getElementById('sidebar');
const overlay      = document.getElementById('overlay');
const btnOpen      = document.getElementById('menu-toggle');
const btnClose     = document.getElementById('sidebar-close');
const gridEl       = document.getElementById('productos-grid');
const sinResultEl  = document.getElementById('sin-resultados');
const contadorEl   = document.getElementById('contador-productos');

// ── Sidebar: abrir / cerrar ───────────────────────────────────
function abrirSidebar() {
    sidebar.classList.add('abierto');
    overlay.classList.add('active');
    btnOpen.classList.add('is-open');
    btnOpen.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
}

function cerrarSidebar() {
    sidebar.classList.remove('abierto');
    overlay.classList.remove('active');
    btnOpen.classList.remove('is-open');
    btnOpen.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
}

btnOpen?.addEventListener('click', abrirSidebar);
btnClose?.addEventListener('click', cerrarSidebar);
overlay?.addEventListener('click', cerrarSidebar);
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarSidebar();
});

// ── Formatear precio ──────────────────────────────────────────
function formatPrecio(num) {
    // Locale explícito para evitar resultados inconsistentes entre navegadores
    return num.toLocaleString('es-CU');
}

// ── Detectar imagen válida ────────────────────────────────────
function imagenValida(url) {
    return url && url.trim() !== '' && !url.includes('TU_ID') && !url.includes('placeholder');
}

// ── Construir HTML de una card ────────────────────────────────
function crearCardHTML(prod) {
    const mensajeWA = encodeURIComponent(
        `Hola, me interesa: ${prod.nombre} — $${formatPrecio(prod.precio)}. ¿Está disponible?`
    );
    const urlWA = `https://wa.me/5356096986?text=${mensajeWA}`;

    const imagenHTML = imagenValida(prod.imagen)
        ? `<img class="producto-img" src="${prod.imagen}" alt="${prod.nombre}" loading="lazy">`
        : `<div class="img-placeholder" aria-hidden="true">
               <span class="ph-star">&#10022;</span>
               <span class="ph-label">Detalles que Enamoran</span>
           </div>`;

    return { html: `
        <div class="producto-img-wrap">
            ${imagenHTML}
            <span class="badge-categoria">${prod.categoria}</span>
            <span class="card-pedir">
                <i class="fab fa-whatsapp" aria-hidden="true"></i>
                Pedir
            </span>
        </div>
        <div class="producto-info">
            <div class="producto-nombre">${prod.nombre}</div>
            <div class="producto-descripcion">${prod.descripcion || ''}</div>
            <div class="card-footer">
                <div class="producto-precio">$${formatPrecio(prod.precio)}</div>
                <div class="card-wa-hint">
                    <i class="fab fa-whatsapp" aria-hidden="true"></i>
                    Pedir
                </div>
            </div>
        </div>
    `, urlWA };
}

// ── Mostrar productos ─────────────────────────────────────────
function mostrarProductos(productos) {
    if (!gridEl) return;

    gridEl.innerHTML = '';

    // Mostrar / ocultar mensaje "sin resultados"
    if (sinResultEl) sinResultEl.hidden = productos.length > 0;

    // Actualizar contador
    if (contadorEl) {
        contadorEl.textContent = productos.length === 0
            ? ''
            : `${productos.length} producto${productos.length !== 1 ? 's' : ''}`;
    }

    productos.forEach((prod, i) => {
        const card = document.createElement('div');
        card.className = 'producto-card';
        card.setAttribute('role', 'listitem');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `${prod.nombre} — $${formatPrecio(prod.precio)}`);

        const { html, urlWA } = crearCardHTML(prod);
        card.innerHTML = html;

        // ── Animación escalonada ──────────────────────────────
        // Forzamos reflow para que la animación se reinicie al filtrar
        card.style.animation = 'none';
        // eslint-disable-next-line no-unused-expressions
        card.offsetHeight; // reflow
        card.style.animation = `fadeUp 0.42s cubic-bezier(0.4,0,0.2,1) ${i * 55}ms both`;

        // ── Eventos de clic / teclado ─────────────────────────
        const abrirWA = () => window.open(urlWA, '_blank', 'noopener');
        card.addEventListener('click', abrirWA);
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                abrirWA();
            }
        });

        gridEl.appendChild(card);
    });
}

// ── Cargar categorías ─────────────────────────────────────────
function cargarCategorias(productos) {
    const unicas = [...new Set(productos.map(p => p.categoria))];
    const lista  = document.getElementById('categorias-lista');
    if (!lista) return;

    lista.innerHTML = '<li><a href="#" data-categoria="todos" class="activo">Todos</a></li>';

    unicas.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" data-categoria="${cat}">${cat}</a>`;
        lista.appendChild(li);
    });

    lista.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            lista.querySelectorAll('a').forEach(x => x.classList.remove('activo'));
            a.classList.add('activo');
            const sel = a.dataset.categoria;
            const filtrados = sel === 'todos'
                ? productosData
                : productosData.filter(p => p.categoria === sel);
            mostrarProductos(filtrados);
            cerrarSidebar();
            // Scroll suave al inicio de los productos
            gridEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

// ── Cargar datos ──────────────────────────────────────────────
fetch('productos.json')
    .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
    })
    .then(data => {
        productosData = data;
        cargarCategorias(data);
        mostrarProductos(data);
    })
    .catch(err => {
        console.error('Error cargando productos:', err);
        if (gridEl) {
            gridEl.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:48px 20px; color:var(--text-muted); font-style:italic;">
                    No se pudieron cargar los productos. Inténtalo más tarde.
                </div>`;
        }
    });
