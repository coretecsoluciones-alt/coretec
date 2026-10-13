/* CORETEC — iPhone 17 Pro en 3D (hero)
   Modelo hecho con geometría (sin archivos externos): cuerpo de aluminio,
   vidrio frontal, pantalla con lock screen, plateau de cámaras y botones.
   Unidades: 1 = 1 cm (150 × 71.9 × 8.75 mm). */

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const COLORS = {
    'deep-blue':     { body: 0x24324c, lens: 0x1a2436 },
    'cosmic-orange': { body: 0xd9692c, lens: 0x8a3b14 },
    'silver':        { body: 0xd6d8db, lens: 0x9a9da2 },
};

const W = 7.19, H = 15.0, D = 0.875, R = 1.12;   // cuerpo
const B = 0.18;                                    // bisel lateral (vista frontal)

const mount = document.getElementById('iphone3d');
if (mount && hasWebGL()) init(mount).catch(err => console.warn('iPhone 3D:', err));

function hasWebGL() {
    try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) { return false; }
}

function rrect(w, h, r) {
    const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
    s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2);
    s.lineTo(x + r, y + h);  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
    s.lineTo(x, y + r);      s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
    return s;
}

function slab(w, h, r, depth, bevel, segs = 8) {
    const g = new THREE.ExtrudeGeometry(rrect(w - 2 * bevel, h - 2 * bevel, Math.max(r - bevel, 0.01)), {
        depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel,
        bevelSegments: segs, curveSegments: 48,
    });
    g.center();
    return g;
}

/* Plano con esquinas redondeadas y UV 0..1 (para la pantalla) */
function roundedPlane(w, h, r) {
    const g = new THREE.ShapeGeometry(rrect(w, h, r), 48);
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
        uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
    }
    return g;
}

async function init(mount) {
    const colorKey = mount.dataset.color in COLORS ? mount.dataset.color : 'deep-blue';
    const palette = COLORS[colorKey];
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Renderer / escena ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.className = 'iphone3d-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const camera = new THREE.PerspectiveCamera(26, 1, 1, 200);
    camera.position.set(0, 0, 39);

    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-12, 16, 20);
    scene.add(key);
    const rim = new THREE.PointLight(0x4d8fff, 220, 60);   // contraluz azul CORETEC
    rim.position.set(10, 4, -12);
    scene.add(rim);
    const rim2 = new THREE.PointLight(0x9fc3ff, 120, 60);
    rim2.position.set(-11, -8, -8);
    scene.add(rim2);

    /* ── Materiales ── */
    const aluminum = new THREE.MeshPhysicalMaterial({
        color: palette.body, metalness: 0.9, roughness: 0.34,
        clearcoat: 0.25, clearcoatRoughness: 0.4,
    });
    const aluminumDark = aluminum.clone();
    aluminumDark.color = new THREE.Color(palette.lens);
    aluminumDark.roughness = 0.28;
    const blackGlass = new THREE.MeshPhysicalMaterial({
        color: 0x030304, metalness: 0, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.03,
    });
    const lensGlass = new THREE.MeshPhysicalMaterial({
        color: 0x05070c, metalness: 0.2, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02,
    });
    const lensCoating = new THREE.MeshPhysicalMaterial({
        color: 0x0a1426, metalness: 0.5, roughness: 0.08,
        iridescence: 0.6, iridescenceIOR: 1.6, iridescenceThicknessRange: [300, 420],
    });
    const backGlass = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(palette.body).multiplyScalar(0.92), metalness: 0.8, roughness: 0.48,
        clearcoat: 0.6, clearcoatRoughness: 0.5,
    });

    /* ── Teléfono ── */
    const phone = new THREE.Group();

    const body = new THREE.Mesh(slab(W, H, R, D - 0.6, 0.3, 10), aluminum);
    // ExtrudeGeometry suma el bisel en profundidad: ajustar a D exacto
    body.geometry.computeBoundingBox();
    body.scale.z = D / (body.geometry.boundingBox.max.z - body.geometry.boundingBox.min.z);
    phone.add(body);

    // Vidrio frontal (negro) apenas sobresaliendo del marco
    const gw = W - 2 * B, gh = H - 2 * B, gr = R - B;
    const glass = new THREE.Mesh(slab(gw, gh, gr, 0.01, 0.03, 4), blackGlass);
    glass.position.z = D / 2 - 0.005;
    phone.add(glass);

    // Pantalla
    const bezel = 0.16;
    const sw = gw - 2 * bezel, sh = gh - 2 * bezel;
    const screenTex = new THREE.CanvasTexture(await drawScreen(sw / sh));
    screenTex.colorSpace = THREE.SRGBColorSpace;
    screenTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const screen = new THREE.Mesh(
        roundedPlane(sw, sh, gr - bezel),
        new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false })
    );
    screen.position.z = D / 2 + 0.031;
    phone.add(screen);

    // Reflejo del vidrio sobre la pantalla (suma el entorno de forma sutil)
    const sheen = new THREE.Mesh(
        roundedPlane(gw - 0.04, gh - 0.04, gr - 0.02),
        new THREE.MeshStandardMaterial({
            color: 0xffffff, metalness: 1, roughness: 0.12,
            transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false,
        })
    );
    sheen.position.z = D / 2 + 0.034;
    phone.add(sheen);

    /* Plateau de cámaras (ancho completo, parte superior trasera) */
    // El borde trasero del cuerpo está redondeado 0.3: el plateau va dentro de esa línea
    const pIn = 0.34, pH = 3.7, pDepth = 0.12;
    const plateau = new THREE.Mesh(slab(W - 2 * pIn, pH, R - pIn, pDepth, 0.07, 6), aluminum);
    const pY = H / 2 - pIn - pH / 2;
    plateau.position.set(0, pY, -D / 2 - (pDepth + 0.14) / 2 + 0.02);
    phone.add(plateau);
    const backZ = -D / 2 - pDepth - 0.12;   // cara exterior del plateau

    // Panel de vidrio esmerilado (parte inferior de la espalda)
    const gGap = 0.5, gBottom = 0.55;
    const gTop = pY - pH / 2 - gGap;
    const gHgt = gTop - (-H / 2 + gBottom);
    const panel = new THREE.Mesh(slab(W - 0.9, gHgt, R - 0.45, 0.004, 0.012, 3), backGlass);
    panel.position.set(0, gTop - gHgt / 2, -D / 2 - 0.006);
    panel.rotation.y = Math.PI;
    phone.add(panel);

    function lens(x, y) {
        const g = new THREE.Group();
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.82, 0.24, 72), aluminumDark);
        ring.rotation.x = Math.PI / 2;
        g.add(ring);
        const glassDisk = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.26, 72), lensGlass);
        glassDisk.rotation.x = Math.PI / 2;
        g.add(glassDisk);
        const inner = new THREE.Mesh(new THREE.CircleGeometry(0.34, 64), lensCoating);
        inner.rotation.y = Math.PI;
        inner.position.z = -0.135;
        g.add(inner);
        const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.13, 48), new THREE.MeshBasicMaterial({ color: 0x000000 }));
        pupil.rotation.y = Math.PI;
        pupil.position.z = -0.137;
        g.add(pupil);
        g.position.set(x, y, backZ - 0.1);
        phone.add(g);
    }
    // Vista desde atrás: el lado +x queda a la izquierda (como en el iPhone real)
    lens(2.25, pY + 0.88);
    lens(2.25, pY - 0.88);
    lens(0.72, pY);

    function dot(x, y, r, mat) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.06, 48), mat);
        m.rotation.x = Math.PI / 2;
        m.position.set(x, y, backZ - 0.01);
        phone.add(m);
    }
    dot(-2.3, pY + 0.85, 0.3, new THREE.MeshPhysicalMaterial({ color: 0xfff2d6, roughness: 0.3, clearcoat: 1, emissive: 0x332a1a }));
    dot(-2.3, pY - 0.85, 0.3, lensGlass);
    dot(-1.25, pY + 1.2, 0.06, blackGlass);

    /* Botones laterales */
    function button(side, y, h, mat = aluminum) {
        const m = new THREE.Mesh(new RoundedBoxGeometry(0.16, h, 0.34, 4, 0.06), mat);
        m.position.set(side * (W / 2 + 0.02), y, 0);
        phone.add(m);
    }
    button(-1, 4.35, 0.62);          // acción
    button(-1, 3.0, 1.0);            // volumen +
    button(-1, 1.75, 1.0);           // volumen −
    button(1, 2.6, 1.6);             // encendido
    button(1, -2.1, 1.25, blackGlass); // Camera Control (zafiro)

    scene.add(phone);

    /* ── Tamaño ── */
    function resize() {
        const w = mount.clientWidth, h = mount.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    new ResizeObserver(resize).observe(mount);
    resize();

    /* ── Pose y movimiento ──
       · Flota suave y se inclina siguiendo el mouse en la página.
       · Al pasar el mouse por encima del iPhone: da una vuelta completa (muestra la espalda).
       · Arrastrar lo gira a mano en cualquier dirección (con el dedo, solo hacia los costados,
         para no trabar el scroll); al soltar sigue por inercia y vuelve al frente. */
    const base = mount.dataset.pose === 'back'
        ? { x: 0.08, y: Math.PI + 0.42, z: 0.05 }
        : { x: 0.08, y: -0.38, z: -0.05 };
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const canHover = matchMedia('(hover: hover)').matches;
    if (!reduceMotion && canHover) {
        window.addEventListener('pointermove', e => {
            target.y = (e.clientX / window.innerWidth - 0.5) * 0.5;
            target.x = (e.clientY / window.innerHeight - 0.5) * 0.25;
        }, { passive: true });
    }

    const clock = new THREE.Clock();
    const TAU = Math.PI * 2;
    const easeInOut = p => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
    const spin = { active: false, start: 0, dur: 1.9 };
    const drag = { on: false, lastX: 0, lastY: 0, vx: 0, vy: 0, lastMove: 0, touch: false };
    const qDrag = new THREE.Quaternion();              // giro del usuario (ejes de pantalla)
    const qTmp = new THREE.Quaternion(), qBase = new THREE.Quaternion(), eBase = new THREE.Euler();
    const AX_Y = new THREE.Vector3(0, 1, 0), AX_X = new THREE.Vector3(1, 0, 0), IDENT = new THREE.Quaternion();
    function turn(dx, dy) {
        qTmp.setFromAxisAngle(AX_Y, dx); qDrag.premultiply(qTmp);
        if (dy) { qTmp.setFromAxisAngle(AX_X, dy); qDrag.premultiply(qTmp); }
    }

    function startSpin() {
        if (spin.active || drag.on || reduceMotion) return;
        spin.active = true;
        spin.start = clock.getElapsedTime();
    }

    // ¿El puntero está sobre el teléfono (no sobre el espacio vacío del canvas)?
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const canvas = renderer.domElement;
    function overPhone(e) {
        const r = canvas.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        return ray.intersectObject(phone, true).length > 0;
    }

    let hovering = false;
    canvas.addEventListener('pointermove', e => {
        if (drag.on) {
            const dx = (e.clientX - drag.lastX) * 0.012;
            const dy = drag.touch ? 0 : (e.clientY - drag.lastY) * 0.012;
            drag.lastX = e.clientX; drag.lastY = e.clientY;
            turn(dx, dy);
            drag.vx = dx; drag.vy = dy;
            drag.lastMove = clock.getElapsedTime();
            return;
        }
        if (e.pointerType !== 'mouse') return;
        const now = overPhone(e);
        if (now && !hovering) startSpin();
        hovering = now;
        canvas.style.cursor = now ? 'grab' : '';
    });
    canvas.addEventListener('pointerleave', () => { hovering = false; canvas.style.cursor = ''; });
    canvas.addEventListener('pointerdown', e => {
        if (!overPhone(e)) return;
        // Si estaba girando solo, continuar el giro a mano desde donde va
        if (spin.active) {
            const p = Math.min((clock.getElapsedTime() - spin.start) / spin.dur, 1);
            turn(easeInOut(p) * TAU, 0);
            spin.active = false;
        }
        drag.on = true;
        drag.touch = e.pointerType !== 'mouse';
        drag.lastX = e.clientX; drag.lastY = e.clientY;
        drag.vx = drag.vy = 0;
        canvas.setPointerCapture(e.pointerId);
        canvas.style.cursor = 'grabbing';
    });
    const endDrag = e => {
        if (!drag.on) return;
        drag.on = false;
        if (clock.getElapsedTime() - drag.lastMove > 0.08) drag.vx = drag.vy = 0;
        canvas.style.cursor = hovering ? 'grab' : '';
        try { canvas.releasePointerCapture(e.pointerId); } catch (err) {}
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    let visible = true, raf = 0, calm = 1;
    function frame() {
        raf = 0;
        const t = clock.getElapsedTime();
        cur.x += (target.x - cur.x) * 0.05;
        cur.y += (target.y - cur.y) * 0.05;

        let extra = 0;
        if (spin.active) {
            const p = (t - spin.start) / spin.dur;
            if (p >= 1) spin.active = false;
            else extra = easeInOut(p) * TAU;
        }
        if (!drag.on) {
            if (Math.abs(drag.vx) + Math.abs(drag.vy) > 0.0008) {   // inercia
                turn(drag.vx, drag.vy);
                drag.vx *= 0.94; drag.vy *= 0.94;
            } else {                                                // volver al frente
                drag.vx = drag.vy = 0;
                qDrag.slerp(IDENT, 0.06);
            }
        }

        const idle = reduceMotion ? 0 : 1;
        calm += ((spin.active || drag.on ? 0 : 1) - calm) * 0.08;   // sin saltos al empezar a girar
        eBase.set(
            base.x + cur.x * calm + Math.sin(t * 0.6) * 0.03 * idle,
            base.y + cur.y * calm + Math.sin(t * 0.4) * 0.08 * idle + extra,
            base.z
        );
        qBase.setFromEuler(eBase);
        phone.quaternion.copy(qDrag).multiply(qBase);
        phone.position.y = Math.sin(t * 1.2) * 0.18 * idle;
        renderer.render(scene, camera);
        if (visible) raf = requestAnimationFrame(frame);
    }
    new IntersectionObserver(([e]) => {
        visible = e.isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(frame);
    }).observe(mount);

    mount.appendChild(renderer.domElement);
    frame();
    mount.classList.add('ready');
}

/* ── Lock screen dibujada en canvas ── */
async function drawScreen(aspect) {
    const cw = 1080, ch = Math.round(cw / aspect);
    const c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    const g = c.getContext('2d');
    try { await document.fonts.load('700 100px Inter'); await document.fonts.load('600 40px Inter'); } catch (e) {}
    const font = (w, s) => `${w} ${s}px Inter, -apple-system, 'Helvetica Neue', Arial, sans-serif`;

    // Wallpaper: fondo profundo con luces de color difusas
    g.fillStyle = '#03050c';
    g.fillRect(0, 0, cw, ch);
    const blob = (x, y, r, col) => {
        const grd = g.createRadialGradient(x, y, 0, x, y, r);
        grd.addColorStop(0, col);
        grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grd;
        g.fillRect(0, 0, cw, ch);
    };
    blob(cw * 0.15, ch * 0.62, cw * 1.0, 'rgba(0,95,255,0.85)');
    blob(cw * 0.95, ch * 0.42, cw * 0.85, 'rgba(110,60,255,0.65)');
    blob(cw * 0.55, ch * 0.95, cw * 0.9, 'rgba(0,190,255,0.45)');
    blob(cw * 0.7, ch * 0.18, cw * 0.6, 'rgba(40,80,200,0.35)');
    // Ondas suaves
    g.save();
    g.filter = 'blur(40px)';
    g.lineCap = 'round';
    [[0.55, 'rgba(160,200,255,0.35)', 160], [0.72, 'rgba(90,140,255,0.4)', 220]].forEach(([k, col, lw]) => {
        g.strokeStyle = col; g.lineWidth = lw;
        g.beginPath();
        g.moveTo(-200, ch * k);
        g.bezierCurveTo(cw * 0.3, ch * (k - 0.18), cw * 0.7, ch * (k + 0.16), cw + 200, ch * (k - 0.08));
        g.stroke();
    });
    g.restore();
    // Oscurecer arriba para que se lea la hora
    const top = g.createLinearGradient(0, 0, 0, ch * 0.4);
    top.addColorStop(0, 'rgba(0,0,0,0.45)'); top.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = top; g.fillRect(0, 0, cw, ch * 0.4);

    const rr = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
    g.fillStyle = '#fff';
    g.textBaseline = 'alphabetic';

    // Barra de estado
    g.font = font(600, 44);
    g.textAlign = 'left';
    g.fillText('9:41', 120, 118);
    for (let i = 0; i < 4; i++) { rr(780 + i * 22, 112 - 12 - i * 8, 14, 12 + i * 8, 3); g.fill(); }
    rr(880, 84, 74, 36, 10); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.5)'; g.stroke();
    rr(886, 90, 56, 24, 6); g.fill();

    // Dynamic Island
    g.fillStyle = '#000';
    rr(cw / 2 - 190, 54, 380, 112, 56); g.fill();

    // Fecha y hora
    const now = new Date();
    let fecha = now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
    fecha = fecha.charAt(0).toUpperCase() + fecha.slice(1);
    g.textAlign = 'center';
    g.fillStyle = 'rgba(255,255,255,0.88)';
    g.font = font(600, 58);
    g.fillText(fecha, cw / 2, 360);
    g.fillStyle = 'rgba(255,255,255,0.96)';
    g.font = font(700, 330);
    g.fillText('9:41', cw / 2, 680);

    // Notificación CORETEC
    const ny = ch * 0.67, nh = 230;
    rr(56, ny, cw - 112, nh, 56);
    g.fillStyle = 'rgba(255,255,255,0.16)'; g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.14)'; g.lineWidth = 2; g.stroke();
    rr(96, ny + 44, 110, 110, 28);
    const ig = g.createLinearGradient(0, ny + 44, 0, ny + 154);
    ig.addColorStop(0, '#16233a'); ig.addColorStop(1, '#0a1220');
    g.fillStyle = ig; g.fill();
    await drawLogoIcon(g, 96, ny + 44, 110);
    g.textAlign = 'left';
    g.fillStyle = '#fff';
    g.font = font(700, 44);
    g.fillText('CORETEC', 240, ny + 88);
    g.fillStyle = 'rgba(255,255,255,0.6)';
    g.font = font(500, 38);
    g.textAlign = 'right';
    g.fillText('ahora', cw - 100, ny + 88);
    g.textAlign = 'left';
    g.fillStyle = 'rgba(255,255,255,0.92)';
    g.font = font(500, 40);
    g.fillText('Tu iPhone 17 Pro ya está listo.', 240, ny + 144);
    g.fillText('Te esperamos en Núñez.', 240, ny + 194);

    // Botones inferiores + indicador de inicio
    [[190, 'torch'], [cw - 190, 'cam']].forEach(([x, kind]) => {
        g.beginPath(); g.arc(x, ch - 250, 82, 0, Math.PI * 2);
        g.fillStyle = 'rgba(255,255,255,0.18)'; g.fill();
        g.fillStyle = '#fff';
        if (kind === 'torch') { rr(x - 16, ch - 290, 32, 80, 10); g.fill(); }
        else { rr(x - 38, ch - 274, 76, 52, 12); g.fill(); g.fillStyle = 'rgba(40,60,110,1)'; g.beginPath(); g.arc(x, ch - 248, 15, 0, Math.PI * 2); g.fill(); }
    });
    g.fillStyle = 'rgba(255,255,255,0.92)';
    rr(cw / 2 - 190, ch - 60, 380, 14, 7); g.fill();

    return c;
}

/* Ícono del logo CORETEC (tomado del SVG del header) */
function drawLogoIcon(g, x, y, size) {
    return new Promise(resolve => {
        const svg = document.querySelector('.nav-logo-svg');
        if (!svg) return resolve();
        const clone = svg.cloneNode(true);
        clone.setAttribute('viewBox', '420 286 120 140');
        clone.setAttribute('width', '120'); clone.setAttribute('height', '140');
        clone.querySelectorAll('.logo-sheen').forEach(n => n.remove());
        clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        const img = new Image();
        img.onload = () => {
            const h = size * 0.62, w = h * 120 / 140;
            g.drawImage(img, x + (size - w) / 2, y + (size - h) / 2, w, h);
            resolve();
        };
        img.onerror = () => resolve();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    });
}
