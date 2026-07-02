// ==========================================
// PLANETA TERRA (THREE.JS) – MÓDULO
// ==========================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ==========================================
// CONFIGURAÇÕES INICIAIS
// ==========================================
const canvas = document.getElementById('networkCanvas');
const section = document.querySelector('.network-section');

if (!canvas || !section) {
    console.error('Elementos necessários não encontrados: canvas ou section');
} else {
    console.log('Elementos encontrados, iniciando Three.js');
}

const isMobile = window.innerWidth < 768;

// ==========================================
// RENDERER
// ==========================================
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2.0));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.82;
renderer.physicallyCorrectLights = true;

// ==========================================
// CENA E CÂMERA
// ==========================================
const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(isMobile ? 40 : 36, 1, 0.01, 5000);
if (isMobile) {
    camera.position.set(0, 0.1, 5.8);
} else {
    camera.position.set(0, 0.05, 3.05);
}

// ==========================================
// EFFECT COMPOSER (BLOOM)
// ==========================================
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(1024, 1024), isMobile ? 0.03 : 0.045, 0.25, 0.5);
composer.addPass(bloomPass);

// ==========================================
// CONTROLES (ORBIT)
// ==========================================
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enableZoom = true;
controls.zoomSpeed = isMobile ? 0.6 : 0.8;
controls.enablePan = false;
controls.minDistance = 2.2;
controls.maxDistance = isMobile ? 9.0 : 7.0;
controls.minPolarAngle = 0.2;
controls.maxPolarAngle = Math.PI - 0.2;
controls.rotateSpeed = isMobile ? 0.35 : 0.42;

// ==========================================
// LUZES
// ==========================================
const SUN_DIR = new THREE.Vector3(5.0, 2.2, 3.8).normalize();
const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.2);
sunLight.position.copy(SUN_DIR.clone().multiplyScalar(85));
scene.add(sunLight);
scene.add(new THREE.AmbientLight(0x0a1020, 0.065));

const fillLight = new THREE.DirectionalLight(0x2a4a7a, 0.09);
fillLight.position.set(-6, -1, -4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0x88aaff, 0.10);
rimLight.position.set(-2, 3, -5);
scene.add(rimLight);

// ==========================================
// ESTRELAS
// ==========================================
{
    const starCount = isMobile ? 4000 : 6000;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
        const r = 450 + Math.random() * 500;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i*3+2] = r * Math.cos(phi);
        
        const intensity = 0.4 + Math.random() * 0.9;
        colors[i*3] = intensity;
        colors[i*3+1] = intensity * (Math.random() > 0.7 ? 0.85 : 1.0);
        colors[i*3+2] = intensity * (Math.random() > 0.8 ? 0.9 : 1.0);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const starMat = new THREE.PointsMaterial({ size: isMobile ? 0.18 : 0.22, vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false });
    scene.add(new THREE.Points(geometry, starMat));
}

// ==========================================
// TEXTURAS DA TERRA
// ==========================================
const loader = new THREE.TextureLoader();
const maxAniso = renderer.capabilities.getMaxAnisotropy();

function loadTex(url, srgb = true) {
    const tex = loader.load(url, undefined, undefined, (err) => {
        console.warn(`Erro ao carregar textura: ${url}`, err);
    });
    tex.anisotropy = isMobile ? Math.min(maxAniso, 4) : maxAniso;
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

const tDay = loadTex('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg', true);
const tNormal = loadTex('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg', false);
const tSpec = loadTex('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg', false);
const tClouds = loadTex('https://raw.githubusercontent.com/mrdoob/three.js/r155/examples/textures/planets/earth_clouds_2048.png', false);
const tNight = loadTex('https://raw.githubusercontent.com/mrdoob/three.js/r155/examples/textures/planets/earth_lights_2048.png', true);

// ==========================================
// MESHES: PLANETA, NUVENS, ATMOSFERA, LUA
// ==========================================
const earthGeo = new THREE.SphereGeometry(1.0, isMobile ? 128 : 256, isMobile ? 128 : 256);
const earthMat = new THREE.MeshPhysicalMaterial({
    map: tDay,
    normalMap: tNormal,
    roughness: 0.95,
    metalness: 0.0,
    reflectivity: 0.03,
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,
    specularMap: tSpec,
    specularIntensity: 0.25,
    emissiveMap: tNight,
    emissive: new THREE.Color(0xffcc88),
    emissiveIntensity: isMobile ? 0.65 : 0.78
});
const earth = new THREE.Mesh(earthGeo, earthMat);
earth.rotation.z = THREE.MathUtils.degToRad(23.5);
scene.add(earth);

const cloudGeo = new THREE.SphereGeometry(1.008, isMobile ? 128 : 256, isMobile ? 128 : 256);
const cloudMat = new THREE.MeshStandardMaterial({
    map: tClouds,
    transparent: true,
    opacity: isMobile ? 0.18 : 0.22,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
});
const clouds = new THREE.Mesh(cloudGeo, cloudMat);
scene.add(clouds);

const atmosGeo = new THREE.SphereGeometry(1.045, isMobile ? 64 : 128, isMobile ? 64 : 128);
const atmosMat = new THREE.ShaderMaterial({
    uniforms: {
        uSunDir: { value: SUN_DIR.clone() },
        uRayColor: { value: new THREE.Color(0x6eb6ff) },
        uTwilightColor: { value: new THREE.Color(0x9ec9ff) }
    },
    vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 uSunDir;
        uniform vec3 uRayColor;
        uniform vec3 uTwilightColor;
        varying vec3 vNormal;
        void main() {
            float cosTheta = dot(vNormal, uSunDir);
            float terminator = smoothstep(-0.15, 0.2, cosTheta);
            vec3 color = mix(uTwilightColor, uRayColor, terminator);
            float intensity = 0.22 + 0.58 * max(cosTheta, 0.0);
            intensity = pow(intensity, 1.25) * 0.38;
            gl_FragColor = vec4(color, intensity * 0.32);
        }
    `,
    transparent: true,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending
});
const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
scene.add(atmosphere);

const moonTex = loadTex('https://threejs.org/examples/textures/planets/moon_1024.jpg', true);
const moonGeo = new THREE.SphereGeometry(0.19, isMobile ? 128 : 256, isMobile ? 128 : 256);
const moonMat = new THREE.MeshStandardMaterial({
    map: moonTex,
    roughness: 0.94,
    metalness: 0.01,
    emissive: 0x111111,
    emissiveIntensity: 0.02
});
const moon = new THREE.Mesh(moonGeo, moonMat);
scene.add(moon);

// ==========================================
// CONTROLE DE ROTAÇÃO AUTOMÁTICA
// ==========================================
let autoRotate = true;
let idleTimer;

const stopAuto = () => {
    autoRotate = false;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { autoRotate = true; }, 4000);
};

canvas.addEventListener('mousedown', stopAuto);
canvas.addEventListener('touchstart', stopAuto, { passive: true });

// ==========================================
// ANIMAÇÃO E RENDERIZAÇÃO
// ==========================================
const clock = new THREE.Clock();

function animate() {
    const t = clock.getElapsedTime();
    const moonRadius = 2.78;
    
    moon.position.x = Math.cos(t * 0.16) * moonRadius;
    moon.position.z = Math.sin(t * 0.16) * moonRadius;
    moon.position.y = Math.sin(t * 0.09) * 0.22;
    moon.rotation.y += 0.0025;
    
    if (autoRotate) {
        earth.rotation.y = 0.45 + t * 0.038;
        clouds.rotation.y = earth.rotation.y + 0.005;
    } else {
        clouds.rotation.y = earth.rotation.y + 0.005;
    }
    
    const sunAngle = t * 0.0042;
    const sunDir = new THREE.Vector3(
        Math.sin(sunAngle) * 0.6 + 0.7,
        0.15,
        Math.cos(sunAngle) * 0.6 + 0.55
    ).normalize();
    atmosMat.uniforms.uSunDir.value = sunDir;
    sunLight.position.copy(sunDir.clone().multiplyScalar(85));
    
    controls.update();
    composer.render();
    requestAnimationFrame(animate);
}

// ==========================================
// REDIMENSIONAMENTO
// ==========================================
function resize() {
    if (!section) return;
    const w = section.clientWidth;
    const h = section.clientHeight;
    const aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    composer.setSize(w, h);
    bloomPass.resolution.set(w, h);
}

window.addEventListener('resize', resize);
resize();

// ==========================================
// INÍCIO COM requestIdleCallback (fallback setTimeout)
// ==========================================
function startThree() {
    animate();
    if (canvas) canvas.style.opacity = '1';
}

if ('requestIdleCallback' in window) {
    requestIdleCallback(startThree, { timeout: 2000 });
} else {
    setTimeout(startThree, 100);
}

// ==========================================
// CRONÔMETRO DE LANÇAMENTO (30 DIAS)
// ==========================================
function initPromoTimer() {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const endTime = new Date().getTime() + thirtyDaysInMs;
    localStorage.removeItem('promoEndTime'); // limpa qualquer valor antigo salvo
    
    function updateTimer() {
        const now = new Date().getTime();
        const distance = endTime - now;

        if (distance < 0) {
            document.getElementById('days').innerText = "00";
            document.getElementById('hours').innerText = "00";
            document.getElementById('minutes').innerText = "00";
            document.getElementById('seconds').innerText = "00";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').innerText = days.toString().padStart(2, '0');
        document.getElementById('hours').innerText = hours.toString().padStart(2, '0');
        document.getElementById('minutes').innerText = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').innerText = seconds.toString().padStart(2, '0');
    }

    updateTimer();
    setInterval(updateTimer, 1000);
}
initPromoTimer();

// ==========================================
// GSAP SCROLLTRIGGER FOR PROMO
// ==========================================
gsap.fromTo('.promo-header > *', 
    { opacity: 0, y: 30 }, 
    { 
        opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: 'power2.out',
        scrollTrigger: { trigger: '.services-promo', start: 'top 80%' }
    }
);

gsap.utils.toArray('.promo-card').forEach((card, i) => {
    gsap.fromTo(card, 
        { opacity: 0, y: 50, scale: 0.95 }, 
        {
            opacity: 1, y: 0, scale: 1, duration: 0.6,
            scrollTrigger: { trigger: '.promo-grid', start: 'top 85%' },
            delay: i * 0.12
        }
    );
});

// ==========================================
// LOCALIZAÇÃO, CLIMA, HORÁRIO E TRADUÇÃO
// Detecção por IP (país real) — não depende do
// idioma do navegador. Uma única chamada à
// ipapi.co retorna cidade, coords E país,
// eliminando o fetch duplicado.
// ==========================================

// Cache global do IP data para compartilhar entre módulos
let _ipData = null;

async function fetchIPData() {
    if (_ipData) return _ipData;
    try {
        const res = await fetch('https://ipapi.co/json/');
        _ipData = await res.json();
    } catch (e) {
        console.warn('ipapi.co indisponível, usando fallback BR:', e);
        _ipData = { city: 'São Paulo', region: 'SP', country_code: 'BR', latitude: -23.5505, longitude: -46.6333 };
    }
    return _ipData;
}

// Descrições do clima em PT e ES
const weatherDescriptions = {
    pt: {
        0: { icon: '☀️', desc: 'CÉU LIMPO' },
        1: { icon: '🌤️', desc: 'PARC. NUBLADO' },
        2: { icon: '⛅', desc: 'NUBLADO' },
        3: { icon: '☁️', desc: 'ENCOBERTO' },
        45: { icon: '🌫️', desc: 'NEVOEIRO' },
        51: { icon: '🌧️', desc: 'CHUVISCO' },
        61: { icon: '🌧️', desc: 'CHUVA' },
        71: { icon: '❄️', desc: 'NEVE' },
        80: { icon: '🌦️', desc: 'PANC. CHUVA' },
        95: { icon: '⛈️', desc: 'TROVOADA' },
        _fallback: { icon: '🌡️', desc: 'CLIMA VAR.' },
        _error: { icon: '🌡️', desc: 'INDISPONÍVEL' }
    },
    es: {
        0: { icon: '☀️', desc: 'CIELO DESPEJADO' },
        1: { icon: '🌤️', desc: 'PARC. NUBLADO' },
        2: { icon: '⛅', desc: 'NUBLADO' },
        3: { icon: '☁️', desc: 'CUBIERTO' },
        45: { icon: '🌫️', desc: 'NIEBLA' },
        51: { icon: '🌧️', desc: 'LLOVIZNA' },
        61: { icon: '🌧️', desc: 'LLUVIA' },
        71: { icon: '❄️', desc: 'NIEVE' },
        80: { icon: '🌦️', desc: 'CHUBASCOS' },
        95: { icon: '⛈️', desc: 'TORMENTA' },
        _fallback: { icon: '🌡️', desc: 'CLIMA VAR.' },
        _error: { icon: '🌡️', desc: 'NO DISPONIBLE' }
    }
};

async function getWeather(lat, lon, lang) {
    const map = weatherDescriptions[lang] || weatherDescriptions.pt;
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`);
        const data = await res.json();
        const temp = Math.round(data.current_weather.temperature);
        const weatherCode = data.current_weather.weathercode;
        const weather = map[weatherCode] || map._fallback;
        return { temp, icon: weather.icon, desc: weather.desc };
    } catch (error) {
        console.warn('Erro ao obter clima:', error);
        return { temp: '--', icon: map._error.icon, desc: map._error.desc };
    }
}

function updateDateTime(lang) {
    const locale = lang === 'es' ? 'es-MX' : 'pt-BR';
    const datetimeElem = document.getElementById('datetimeDisplay');
    if (!datetimeElem) return;
    const tick = () => {
        const now = new Date();
        datetimeElem.innerHTML = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    };
    tick();
    setInterval(tick, 1000);
}

async function initWeatherWidget(lang) {
    const ip = await fetchIPData();
    const city = ip.city || 'São Paulo';
    const region = ip.region || 'SP';
    const lat = ip.latitude || -23.5505;
    const lon = ip.longitude || -46.6333;

    const locationElem = document.getElementById('locationDisplay');
    if (locationElem) locationElem.innerHTML = `${city.toUpperCase()}, ${region.toUpperCase()}`;

    const weather = await getWeather(lat, lon, lang);
    const weatherConditionElem = document.getElementById('weatherCondition');
    const tempValueElem = document.getElementById('tempValue');
    const weatherIconElem = document.getElementById('weatherIcon');
    if (weatherConditionElem) weatherConditionElem.innerHTML = weather.desc;
    if (tempValueElem) tempValueElem.innerHTML = weather.temp;
    if (weatherIconElem) weatherIconElem.innerHTML = weather.icon;

    updateDateTime(lang);
}

// ==========================================
// TRADUÇÃO AUTOMÁTICA (PT → ES) POR PAÍS VIA IP
// Detecção real: se o IP é do México (MX) ou
// de qualquer país de língua espanhola, traduz.
// Fallback: navigator.language para casos onde
// ipapi.co falhou.
// ==========================================

// Países de língua espanhola (ISO 3166-1 alpha-2)
const SPANISH_COUNTRIES = new Set([
    'MX','ES','AR','CO','CL','PE','VE','EC','GT','CU',
    'BO','DO','HN','PY','SV','NI','CR','PA','UY','GQ','PR'
]);

const translations = {
    // === MENU ===
    'Soluções': 'Soluciones',
    'Cases de ROI': 'Casos de ROI',
    'A Engenharia': 'La Ingeniería',
    'Falar com especialista →': 'Hablar con especialista →',

    // === HERO ===
    'ENGENHARIA DE CONVERSÃO & POSICIONAMENTO': 'INGENIERÍA DE CONVERSIÓN & POSICIONAMIENTO',
    'O site que transforma': 'El sitio que transforma',
    'visitantes em resultados reais': 'visitantes en resultados reales',
    'Enquanto você dorme, seu site trabalha: velocidade &lt; 0,8s, SEO estrutural e jornada de compra que vende. Criamos ecossistemas digitais que não só atraem clientes, mas os transformam em defensores da sua marca — com ROI comprovado em até 90 dias.': 'Mientras duermes, tu sitio trabaja: velocidad &lt; 0,8s, SEO estructural y un recorrido de compra que vende. Creamos ecosistemas digitales que no solo atraen clientes, sino que los convierten en defensores de tu marca — con ROI comprobado en hasta 90 días.',
    'Quero uma proposta agora': 'Quiero una propuesta ahora',
    '✔️ Sem fidelidade': '✔️ Sin fidelidad',
    '✔️ Entrega em até 14 dias úteis': '✔️ Entrega en hasta 14 días hábiles',
    '✔️ Suporte prioritário': '✔️ Soporte prioritario',
    '✔️ Garantia de performance': '✔️ Garantía de rendimiento',

    // === SHOWCASE ===
    'PORTFÓLIO DE ALTO DESEMPENHO': 'PORTAFOLIO DE ALTO RENDIMIENTO',
    'Tecnologia que se paga': 'Tecnología que se paga',
    'sozinha em poucos meses': 'sola en pocos meses',
    'Cada projeto é uma máquina de faturamento: arquitetura limpa, carregamento abaixo de 0,8s, SEO que coloca você no topo do Google e taxas de conversão até <strong>3x superiores</strong> à média do mercado. Resultado: mais leads, menos custo por aquisição e um ativo digital que valoriza seu negócio.': 'Cada proyecto es una máquina de facturación: arquitectura limpia, carga por debajo de 0,8s, SEO que te coloca en la cima de Google y tasas de conversión hasta <strong>3x superiores</strong> al promedio del mercado. Resultado: más leads, menor costo por adquisición y un activo digital que valoriza tu negocio.',
    'Ver resultado de cliente →': 'Ver resultado de cliente →',

    // === DASHBOARD ===
    'O DNA da RSO': 'El ADN de RSO',
    'Não entregamos código. Entregamos ROI. Nossos clientes têm, em média,': 'No entregamos código. Entregamos ROI. Nuestros clientes tienen, en promedio,',
    '% de aumento em leads qualificados nos primeiros 90 dias. Cada linha de código é escrita pensando na sua margem — e cada decisão de design, na sua conversão.': '% de aumento en leads calificados en los primeros 90 días. Cada línea de código está escrita pensando en tu margen — y cada decisión de diseño, en tu conversión.',
    'Case comprovado': 'Caso comprobado',
    '+312% em receita em 6 meses': '+312% en ingresos en 6 meses',
    'Indústria Metalúrgica • Portfólio institucional': 'Industria Metalúrgica • Portafolio institucional',
    '"Nosso antigo site não gerava nenhum contato. Com a RSO, passamos a receber propostas comerciais toda semana. O investimento se pagou em 45 dias." – Diretor Comercial': '"Nuestro antiguo sitio no generaba ningún contacto. Con RSO, comenzamos a recibir propuestas comerciales cada semana. La inversión se pagó en 45 días." – Director Comercial',
    'Ver estudo de caso →': 'Ver estudio de caso →',
    'SEO que atrai clientes prontos para comprar': 'SEO que atrae clientes listos para comprar',
    'Mais de 80% das compras começam com uma busca. Nossa engenharia de SEO coloca seu negócio na frente de quem já decidiu adquirir — e seus concorrentes, atrás.': 'Más del 80% de las compras comienzan con una búsqueda. Nuestra ingeniería de SEO coloca tu negocio delante de quienes ya decidieron adquirir — y a tus competidores, atrás.',
    'Sistemas que escalam operações': 'Sistemas que escalan operaciones',
    'Automatize processos críticos, reduza custos operacionais e ganhe eficiência com plataformas desenhadas exatamente para o seu modelo de negócio. Menos tempo com tarefas manuais, mais tempo para crescer.': 'Automatiza procesos críticos, reduce costos operativos y gana eficiencia con plataformas diseñadas exactamente para tu modelo de negocio. Menos tiempo en tareas manuales, más tiempo para crecer.',

    // === PLANETA ===
    'PRESENÇA GLOBAL • PERFORMANCE LOCAL': 'PRESENCIA GLOBAL • RENDIMIENTO LOCAL',
    'Seu concorrente já tem um site que vende. E você?': 'Tu competidor ya tiene un sitio que vende. ¿Y tú?',
    'A primeira impressão é digital — e ela dura menos de 3 segundos. Um site lento, desatualizado ou mal estruturado não só afasta clientes, como também queima sua credibilidade. Nós construímos ativos digitais que trabalham por você 24 horas por dia, 7 dias por semana: gerando leads, vendas e autoridade enquanto você dorme.': 'La primera impresión es digital — y dura menos de 3 segundos. Un sitio lento, desactualizado o mal estructurado no solo aleja clientes, sino que también quema tu credibilidad. Nosotros construimos activos digitales que trabajan por ti 24 horas al día, 7 días a la semana: generando leads, ventas y autoridad mientras duermes.',
    'Quero um site que vende': 'Quiero un sitio que vende',
    '🔹 Contratos transparentes, sem surpresas 🔹 100% focado em resultado': '🔹 Contratos transparentes, sin sorpresas 🔹 100% enfocado en resultados',
    '🔹 Atendimento exclusivo para negócios com faturamento a partir de R$ 30k/mês 🔹 Contratos transparentes, sem surpresas 🔹 100% focado em resultado': '🔹 Atención exclusiva para negocios con facturación desde R$ 30k/mes 🔹 Contratos transparentes, sin sorpresas 🔹 100% enfocado en resultados',

    // === PROMOÇÃO ===
    'OFERTA DE LANÇAMENTO • VAGAS LIMITADAS': 'OFERTA DE LANZAMIENTO • VACANTES LIMITADAS',
    'Invista agora com até': 'Invierte ahora con hasta',
    '47% de desconto': '47% de descuento',
    'Estou montando minha carteira inicial de cases de sucesso. Esses preços exclusivos expiram em': 'Estoy armando mi cartera inicial de casos de éxito. Estos precios exclusivos expiran en',
    '30 dias': '30 días',
    '— depois, os valores retornam ao normal. Garanta sua vaga e comece a colher resultados antes da concorrência.': '— después, los valores vuelven a la normalidad. Asegura tu vacante y comienza a cosechar resultados antes que la competencia.',
    'MAIS ESCOLHIDO': 'MÁS ELEGIDO',

    // === COUNTDOWN ===
    'DIAS': 'DÍAS',
    'HRS': 'HRS',
    'MIN': 'MIN',
    'SEG': 'SEG',

    // === NOMES DOS PLANOS ===
    'Básico': 'Básico',
    'Premium': 'Premium',

    // === PREÇOS (contexto) ===
    'De R$': 'De R$',

    // === BENEFÍCIOS DOS PLANOS ===
    '✔️ Design responsivo': '✔️ Diseño responsivo',
    '✔️ SEO básico': '✔️ SEO básico',
    '✔️ Entrega em 7 dias': '✔️ Entrega en 7 días',
    '✔️ SEO técnico avançado': '✔️ SEO técnico avanzado',
    '✔️ Funil de conversão': '✔️ Embudo de conversión',
    '✔️ Suporte 24/7': '✔️ Soporte 24/7',
    '✔️ Automação de processos': '✔️ Automatización de procesos',
    '✔️ IA integrada': '✔️ IA integrada',
    '✔️ Painel exclusivo': '✔️ Panel exclusivo',
    '✔️ iOS / Android': '✔️ iOS / Android',
    '✔️ Notificações push': '✔️ Notificaciones push',
    '✔️ Publicação nas lojas': '✔️ Publicación en tiendas',

    // === ESCASSEZ ===
    '⚠️ 4 vagas': '⚠️ 4 lugares',
    '⚠️ 2 vagas': '⚠️ 2 lugares',
    '⚠️ 1 vaga': '⚠️ 1 lugar',

    // === BOTÕES DOS CARDS ===
    'Garantir': 'Asegurar',
    'Quero este': 'Quiero este',
    'Agendar': 'Agendar',
    'Orçar': 'Cotizar',

    // === PRELOADER ===
    'CARREGANDO ECOSSISTEMA DIGITAL': 'CARGANDO ECOSISTEMA DIGITAL',
    'ENGENHARIA DE CONVERSÃO': 'INGENIERÍA DE CONVERSIÓN',

    // === BLOCO VANGUARD / CLIMA ===
    'LIVE DATA FEED': 'DATOS EN VIVO',
    'LOCATION': 'UBICACIÓN',
    'LOCAL TIME': 'HORA LOCAL',
    'CONDITION': 'CONDICIÓN',
    'SINCRONIZANDO': 'SINCRONIZANDO',
    'CARREGANDO...': 'CARGANDO...',

    // === SEÇÃO SOBRE (DNA) ===
    'PORTFÓLIO DE ALTO DESEMPENHO': 'PORTAFOLIO DE ALTO RENDIMIENTO',

    // === RODAPÉ ===
    'Engenharia de sites que multiplica resultados.': 'Ingeniería de sitios que multiplica resultados.',
    '🏆 Destaque 2025': '🏆 Destacado 2025',
    '⭐ ROI comprovado': '⭐ ROI comprobado',
    'Navegue': 'Navega',
    'Soluções': 'Soluciones',
    'Cases de ROI': 'Casos de ROI',
    'A Engenharia': 'La Ingeniería',
    'Fale conosco': 'Contáctanos',
    'Especialidades': 'Especialidades',
    'Sites de alta conversão': 'Sitios de alta conversión',
    'SEO estrutural': 'SEO estructural',
    'Sistemas sob medida': 'Sistemas a medida',
    'Aplicativos mobile': 'Aplicaciones móviles',
    'Conecte-se': 'Conéctate',
    '© 2026 RSO DIGITAL — Todos os direitos reservados.': '© 2026 RSO DIGITAL — Todos los derechos reservados.',
    '• Política de Privacidade': '• Política de Privacidad',
    'Política de Privacidade': 'Política de Privacidad',

    // === FAQ (nova seção) ===
    'Perguntas Frequentes': 'Preguntas Frecuentes',
    'Quanto custa criar um site profissional?': '¿Cuánto cuesta crear un sitio web profesional?',
    'Na RSO Digital, a criação de um site profissional começa em R$ 700 (ou $2.500 MXN) para o plano básico com design responsivo, SEO básico e entrega em 7 dias úteis. O plano Premium, com SEO técnico avançado e funil de conversão completo, sai por R$ 2.000 (ou $7.000 MXN). Entre em contato pelo WhatsApp para um orçamento personalizado.': 'En RSO Digital, la creación de un sitio web profesional comienza en R$ 700 (o $2.500 MXN) para el plan básico con diseño responsivo, SEO básico y entrega en 7 días hábiles. El plan Premium, con SEO técnico avanzado y embudo de conversión completo, cuesta R$ 2.000 (o $7.000 MXN). Contáctanos por WhatsApp para un presupuesto personalizado.',
    'Em quanto tempo meu site fica pronto?': '¿En cuánto tiempo estará listo mi sitio?',
    'Sites básicos são entregues em até 7 dias úteis. Projetos Premium e sistemas personalizados têm prazo de até 14 dias úteis. O site já é entregue hospedado, configurado e com SEO implementado, pronto para gerar resultados.': 'Los sitios básicos se entregan en hasta 7 días hábiles. Los proyectos Premium y sistemas personalizados tienen un plazo de hasta 14 días hábiles. El sitio se entrega ya alojado, configurado y con SEO implementado, listo para generar resultados.',
    'O site vai aparecer no Google após a criação?': '¿El sitio aparecerá en Google después de la creación?',
    'Sim. Todo site criado pela RSO Digital já inclui SEO técnico e estrutural: meta tags otimizadas, Schema.org, integração com Google Search Console e carregamento abaixo de 0,8s. Clientes Premium recebem estratégia completa para alcançar a primeira página do Google em até 90 dias.': 'Sí. Todo sitio creado por RSO Digital ya incluye SEO técnico y estructural: meta tags optimizadas, Schema.org, integración con Google Search Console y carga por debajo de 0,8s. Los clientes Premium reciben una estrategia completa para alcanzar la primera página de Google en hasta 90 días.',
    'Como funciona o pagamento?': '¿Cómo funciona el pago?',
    'Aceitamos Pix, transferência bancária e cartão de crédito em até 12x. O pagamento é dividido: 50% na entrada e 50% na entrega. Sem fidelidade contratual mínima — você paga pelo projeto entregue, sem mensalidades obrigatórias.': 'Aceptamos Pix, transferencia bancaria y tarjeta de crédito en hasta 12 cuotas. El pago se divide: 50% al inicio y 50% en la entrega. Sin fidelidad contractual mínima — pagas por el proyecto entregado, sin mensualidades obligatorias.',
    'A RSO Digital atende empresas no México?': '¿RSO Digital atiende empresas en México?',
    'Sim! Atendemos clientes no Brasil e no México com preços em BRL e MXN. Nossa equipe fala português e espanhol, com comunicação via WhatsApp e videoconferência. Clientes mexicanos podem pagar em pesos mexicanos (MXN).': '¡Sí! Atendemos clientes en Brasil y México con precios en BRL y MXN. Nuestro equipo habla portugués y español, con comunicación vía WhatsApp y videoconferencia. Los clientes mexicanos pueden pagar en pesos mexicanos (MXN).',
    'O que está incluso no SEO técnico avançado?': '¿Qué incluye el SEO técnico avanzado?',
    'O SEO técnico avançado inclui: auditoria completa, otimização de Core Web Vitals, Schema.org estruturado, otimização de meta tags e conteúdo, link building, integração com Google Analytics 4 e Search Console, relatórios mensais e ajustes contínuos de estratégia para posicionamento no Google Brasil e México.': 'El SEO técnico avanzado incluye: auditoría completa, optimización de Core Web Vitals, Schema.org estructurado, optimización de meta tags y contenido, link building, integración con Google Analytics 4 y Search Console, informes mensuales y ajustes continuos de estrategia para posicionamiento en Google Brasil y México.'
};

function applyTranslations() {
    // Atualiza o atributo lang do html
    document.documentElement.setAttribute('lang', 'es-MX');

    // Passa pelo texto de todos os nós
    const elements = document.querySelectorAll('body *:not(script):not(style):not(meta):not(link):not(title)');
    // Ordena keys da mais longa para a mais curta para evitar substituições parciais
    const keys = Object.keys(translations).sort((a, b) => b.length - a.length);

    elements.forEach(el => {
        // Nós de texto diretos (sem filhos elemento)
        if (el.children.length === 0) {
            const original = el.textContent.trim();
            if (original && translations[original]) {
                el.textContent = translations[original];
                return;
            }
        }
        // Nós de texto dentro de elementos com filhos (ex: <p> com <strong> dentro)
        el.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const t = node.textContent.trim();
                if (t && translations[t]) {
                    node.textContent = node.textContent.replace(t, translations[t]);
                }
            }
        });
        // innerHTML para elementos com markup misto (ex: <strong>, <span>)
        const html = el.innerHTML;
        if (html) {
            keys.forEach(key => {
                if (html.includes(key)) {
                    // Escapa a key para uso em RegExp (cuida de caracteres especiais)
                    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    el.innerHTML = el.innerHTML.replace(new RegExp(escaped, 'g'), translations[key]);
                }
            });
        }
    });

    // Traduz title da página
    document.title = 'RSO DIGITAL | Creación de Sitios y SEO que Multiplica Resultados — Agencia Digital';

    // Traduz meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Agencia de creación de sitios web con SEO estructural, ingeniería de conversión y entrega en hasta 14 días. Más del 187% de aumento en leads calificados en los primeros 90 días. Solicita tu presupuesto gratis por WhatsApp.');

    // Traduz og:title e og:description
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'RSO DIGITAL — Creación de Sitios y SEO que Vende | Agencia Digital');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', 'Sitios de alta conversión, SEO técnico e ingeniería digital que transforman visitantes en clientes reales. Presupuesto gratis y entrega en hasta 14 días hábiles.');

    console.log('🌐 Tradução ES aplicada via detecção por país (IP)');
}

// Detecta idioma via IP — uma única chamada, resultado compartilhado
async function initLocale() {
    const ip = await fetchIPData();
    const countryCode = (ip.country_code || '').toUpperCase();
    // Fallback: navigator.language se ipapi.co falhou e retornou 'BR' hardcoded
    const browserLang = navigator.language || navigator.languages?.[0] || '';
    const isSpanish = SPANISH_COUNTRIES.has(countryCode) || browserLang.startsWith('es');
    const lang = isSpanish ? 'es' : 'pt';

    // Inicializa widget de clima com o idioma correto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initWeatherWidget(lang));
    } else {
        initWeatherWidget(lang);
    }

    // Aplica tradução se for país de língua espanhola
    if (isSpanish) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyTranslations);
        } else {
            applyTranslations();
        }
        // Segunda passagem após load (garante elementos renderizados por JS/GSAP)
        window.addEventListener('load', applyTranslations);
    }
}

initLocale();

// ==========================================
// PRELOADER COM EFEITO DE DIGITAÇÃO + TIMEOUT DE SEGURANÇA
// ==========================================
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    const progressBar = document.getElementById('progressBar');
    const textElement = document.getElementById('preloaderText');
    const originalText = textElement.textContent;
    textElement.textContent = '';
    textElement.style.borderRight = '2px solid rgba(234, 255, 0, 0.6)';
    
    let progress = 0;
    let charIndex = 0;
    let isTypingDone = false;
    let preloaderHidden = false;

    // Função de digitação
    function typeWriter() {
        if (charIndex < originalText.length) {
            textElement.textContent += originalText.charAt(charIndex);
            charIndex++;
            setTimeout(typeWriter, 45);
        } else {
            isTypingDone = true;
        }
    }

    // Inicia a digitação imediatamente
    typeWriter();

    // Progresso da barra
    const interval = setInterval(() => {
        progress += Math.random() * 10 + 5;
        if (progress > 100) progress = 100;
        progressBar.style.width = progress + '%';
        if (progress >= 100) {
            clearInterval(interval);
            // Espera a digitação terminar (ou força após 2s)
            const checkDone = setInterval(() => {
                if (isTypingDone && !preloaderHidden) {
                    clearInterval(checkDone);
                    setTimeout(() => {
                        preloader.classList.add('hidden');
                        preloaderHidden = true;
                        initCounterAnimations();
                    }, 500);
                }
            }, 100);
            // Fallback: após 3s
            setTimeout(() => {
                if (!preloaderHidden) {
                    preloader.classList.add('hidden');
                    preloaderHidden = true;
                    initCounterAnimations();
                }
            }, 3000);
        }
    }, 180);

    // TIMEOUT DE SEGURANÇA: se o preloader não sumir em 5 segundos, força o desaparecimento
    setTimeout(() => {
        if (!preloaderHidden) {
            preloader.classList.add('hidden');
            preloaderHidden = true;
            initCounterAnimations();
        }
    }, 5000);
});

// ==========================================
// ANIMAÇÃO DE CONTAGEM (NÚMEROS)
// ==========================================
function initCounterAnimations() {
    const counters = document.querySelectorAll('.count-number');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        if (isNaN(target)) return;
        
        let current = 0;
        const increment = Math.ceil(target / 80);
        const duration = 2000;
        const stepTime = Math.floor(duration / 80);
        
        const updateCounter = () => {
            current += increment;
            if (current >= target) {
                counter.textContent = target;
                return;
            }
            counter.textContent = current;
            setTimeout(updateCounter, stepTime);
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    updateCounter();
                    observer.disconnect();
                }
            });
        }, { threshold: 0.5 });
        observer.observe(counter);
    });
}

// ==========================================
// CURSOR PERSONALIZADO
// ==========================================
if (window.innerWidth > 768) {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';
    });
    
    function animateRing() {
        ringX += (mouseX - ringX) * 0.12;
        ringY += (mouseY - ringY) * 0.12;
        ring.style.left = ringX + 'px';
        ring.style.top = ringY + 'px';
        requestAnimationFrame(animateRing);
    }
    animateRing();
    
    const interactive = document.querySelectorAll('a, button, .promo-card, .dashboard-block, .explore-link, .shiny-cta, .btn, .promo-cta, .arrow-link, .btn-event');
    interactive.forEach(el => {
        el.addEventListener('mouseenter', () => {
            ring.style.width = '56px';
            ring.style.height = '56px';
            ring.style.borderColor = 'rgba(234, 255, 0, 0.8)';
            dot.style.width = '12px';
            dot.style.height = '12px';
            dot.style.background = '#eaff00';
        });
        el.addEventListener('mouseleave', () => {
            ring.style.width = '36px';
            ring.style.height = '36px';
            ring.style.borderColor = 'rgba(234, 255, 0, 0.4)';
            dot.style.width = '8px';
            dot.style.height = '8px';
            dot.style.background = '#eaff00';
        });
    });
}

// ==========================================
// ROLAGEM SUAVE PARA LINKS DO MENU (âncoras)
// ==========================================
document.querySelectorAll('.links a[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const menuHeight = 80; // mesmo valor do scroll-margin-top
                const top = target.getBoundingClientRect().top + window.scrollY - menuHeight;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        }
    });
});

// ==========================================
// FECHAR MENU MOBILE AO CLICAR EM UM LINK
// ==========================================
document.querySelectorAll('.links a').forEach(link => {
    link.addEventListener('click', () => {
        const checkbox = document.getElementById('menu-toggle');
        if (checkbox && checkbox.checked) {
            checkbox.checked = false;
        }
    });
});

// ==========================================
// GSAP E ANIMAÇÕES DO SITE
// ==========================================
gsap.registerPlugin(ScrollTrigger);
window.addEventListener('load', () => {
    gsap.fromTo('.club-kicker', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
    gsap.fromTo('.hero-title', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.9, ease: 'back.out(0.7)', delay: 0.2 });
    gsap.fromTo('.hero-copy', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out', delay: 0.4 });
    gsap.fromTo('.shiny-cta', { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)', delay: 0.6 });

    gsap.to('.hero-video', {
        y: 100,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.8 }
    });

    const gallery3d = document.querySelector('.gallery-3d');
    const wrapper = document.querySelector('.gallery-3d-wrapper');
    if (gallery3d && wrapper) {
        gallery3d.style.animationPlayState = 'running';
        wrapper.addEventListener('mouseenter', () => gsap.to(gallery3d, { duration: 0.3, animationPlayState: 'paused', overwrite: true }));
        wrapper.addEventListener('mouseleave', () => gsap.to(gallery3d, { duration: 0.3, animationPlayState: 'running', overwrite: true }));
    }

    gsap.utils.toArray('.dashboard-block').forEach((card, i) => {
        gsap.fromTo(card, { opacity: 0, y: 50, scale: 0.95 }, {
            opacity: 1, y: 0, scale: 1, duration: 0.6,
            scrollTrigger: { trigger: card, start: 'top 85%', toggleActions: 'play none none reverse' },
            delay: i * 0.08
        });
    });

    gsap.fromTo('.showcase-content', { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.8, scrollTrigger: { trigger: '.fleet-showcase', start: 'top 80%' } });
    gsap.fromTo('.showcase-carousel', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.9, scrollTrigger: { trigger: '.fleet-showcase', start: 'top 75%' } });

    gsap.fromTo('.footer', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, scrollTrigger: { trigger: '.footer', start: 'top 90%' } });
});

// ==========================================
// EFEITO DE DIGITAÇÃO (TYPEWRITER) NO SUBTÍTULO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const copyElement = document.getElementById('heroCopy');
    if (!copyElement) return;
    
    const originalText = copyElement.textContent;
    const textToType = originalText;
    
    copyElement.textContent = '';
    copyElement.style.opacity = '1';
    copyElement.style.transform = 'translateY(0)';
    
    let index = 0;
    const speed = 18;
    
    function typeWriter() {
        if (index < textToType.length) {
            copyElement.textContent += textToType.charAt(index);
            index++;
            setTimeout(typeWriter, speed);
        }
    }
    
    setTimeout(typeWriter, 800);
});