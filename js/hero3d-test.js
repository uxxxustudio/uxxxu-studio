import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = document.getElementById('character');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

// --------------------------------------------------
// CAMERA
// --------------------------------------------------

const camera = new THREE.PerspectiveCamera(
    32,
    container.clientWidth / container.clientHeight,
    0.1,
    100
);

camera.position.set(0, 0.15, 8);

// --------------------------------------------------
// RENDERER
// --------------------------------------------------

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

container.appendChild(renderer.domElement);

// --------------------------------------------------
// LIGHT
// --------------------------------------------------

const ambient = new THREE.HemisphereLight(
    0xffffff,
    0x111111,
    2.2
);

scene.add(ambient);

const keyLight = new THREE.DirectionalLight(
    0xffffff,
    3
);

keyLight.position.set(3, 5, 6);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(
    0x88ffbb,
    1.2
);

fillLight.position.set(-4, 1, 4);
scene.add(fillLight);

// --------------------------------------------------
// MATERIALS
// --------------------------------------------------

const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xbfc5c0,
    roughness: 0.58,
    metalness: 0.02,
    flatShading: false
});

const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x080909,
    roughness: 0.38,
    metalness: 0.15,
    flatShading: false
});

const greenMaterial = new THREE.MeshStandardMaterial({
    color: 0x65ff9b,
    emissive: 0x1aff68,
    emissiveIntensity: 0.35,
    roughness: 0.28,
    metalness: 0.1
});

// --------------------------------------------------
// CHARACTER GROUP
// --------------------------------------------------

const character = new THREE.Group();

character.position.y = -0.1;

scene.add(character);

// --------------------------------------------------
// HEAD
// --------------------------------------------------

const headGeometry = new THREE.SphereGeometry(
    1.55,
    64,
    48
);

headGeometry.scale(0.86, 1.05, 0.82);

const head = new THREE.Mesh(
    headGeometry,
    skinMaterial
);

head.position.set(0, 1.05, 0);

character.add(head);

// --------------------------------------------------
// HAIR
// --------------------------------------------------

const hairGeometry = new THREE.SphereGeometry(
    1.58,
    64,
    40,
    0,
    Math.PI * 2,
    0,
    Math.PI * 0.48
);

hairGeometry.scale(0.88, 0.75, 0.84);

const hair = new THREE.Mesh(
    hairGeometry,
    darkMaterial
);

hair.position.set(0, 2.0, -0.02);

character.add(hair);

// --------------------------------------------------
// HAIR SIDES
// --------------------------------------------------

function createHairSide(x) {

    const geometry = new THREE.SphereGeometry(
        0.7,
        48,
        32
    );

    geometry.scale(0.55, 1.45, 0.38);

    const mesh = new THREE.Mesh(
        geometry,
        darkMaterial
    );

    mesh.position.set(x, 1.15, -0.05);

    character.add(mesh);
}

createHairSide(-1.08);
createHairSide(1.08);

// --------------------------------------------------
// NECK
// --------------------------------------------------

const neckGeometry = new THREE.CylinderGeometry(
    0.42,
    0.48,
    0.75,
    48
);

const neck = new THREE.Mesh(
    neckGeometry,
    skinMaterial
);

neck.position.set(0, -0.28, 0);

character.add(neck);

// --------------------------------------------------
// SHOULDERS
// --------------------------------------------------

const shoulderGeometry = new THREE.SphereGeometry(
    1.35,
    64,
    40
);

shoulderGeometry.scale(1.55, 0.55, 0.72);

const shoulders = new THREE.Mesh(
    shoulderGeometry,
    darkMaterial
);

shoulders.position.set(0, -0.65, -0.02);

character.add(shoulders);

// --------------------------------------------------
// EYES
// --------------------------------------------------

function createEye(x) {

    const geometry = new THREE.SphereGeometry(
        0.28,
        48,
        32
    );

    geometry.scale(0.78, 1.35, 0.32);

    const eye = new THREE.Mesh(
        geometry,
        darkMaterial
    );

    eye.position.set(x, 1.15, 1.23);

    character.add(eye);
}

createEye(-0.52);
createEye(0.52);

// --------------------------------------------------
// NOSE
// --------------------------------------------------

const noseGeometry = new THREE.SphereGeometry(
    0.18,
    40,
    32
);

noseGeometry.scale(0.72, 1.15, 0.65);

const nose = new THREE.Mesh(
    noseGeometry,
    skinMaterial
);

nose.position.set(0, 0.72, 1.27);

character.add(nose);

// --------------------------------------------------
// MOUTH
// --------------------------------------------------

const mouthCurve = new THREE.EllipseCurve(
    0,
    0,
    0.38,
    0.18,
    Math.PI * 0.12,
    Math.PI * 0.88,
    false,
    0
);

const mouthPoints = mouthCurve.getPoints(32);

const mouthGeometry = new THREE.BufferGeometry().setFromPoints(
    mouthPoints.map(p => new THREE.Vector3(p.x, p.y, 0))
);

const mouthMaterial = new THREE.LineBasicMaterial({
    color: 0x080909,
    linewidth: 2
});

const mouth = new THREE.Line(
    mouthGeometry,
    mouthMaterial
);

mouth.position.set(0, 0.36, 1.42);
mouth.scale.set(1, 0.7, 1);

character.add(mouth);

// --------------------------------------------------
// GLASSES
// --------------------------------------------------

function createGlassesFrame(x) {

    const curve = new THREE.EllipseCurve(
        0,
        0,
        0.62,
        0.48,
        0,
        Math.PI * 2,
        false,
        0
    );

    const points = curve.getPoints(80);

    const geometry = new THREE.BufferGeometry().setFromPoints(
        points.map(p =>
            new THREE.Vector3(
                p.x + x,
                p.y + 1.1,
                1.48
            )
        )
    );

    const material = new THREE.LineBasicMaterial({
        color: 0x9affb8
    });

    const frame = new THREE.LineLoop(
        geometry,
        material
    );

    character.add(frame);
}

createGlassesFrame(-0.55);
createGlassesFrame(0.55);

// --------------------------------------------------
// GLASSES BRIDGE
// --------------------------------------------------

const bridgeGeometry = new THREE.CapsuleGeometry(
    0.045,
    0.34,
    8,
    16
);

const bridge = new THREE.Mesh(
    bridgeGeometry,
    greenMaterial
);

bridge.rotation.z = Math.PI / 2;
bridge.position.set(0, 1.1, 1.48);

character.add(bridge);

// --------------------------------------------------
// GLASSES TEMPLES
// --------------------------------------------------

function createTemple(x) {

    const geometry = new THREE.CylinderGeometry(
        0.035,
        0.035,
        0.85,
        16
    );

    const temple = new THREE.Mesh(
        geometry,
        greenMaterial
    );

    temple.rotation.z = Math.PI / 2;

    temple.position.set(
        x,
        1.1,
        1.32
    );

    character.add(temple);
}

createTemple(-1.18);
createTemple(1.18);

// --------------------------------------------------
// OUTER RING
// --------------------------------------------------

const ringGeometry = new THREE.TorusGeometry(
    2.45,
    0.035,
    20,
    160
);

const ring = new THREE.Mesh(
    ringGeometry,
    greenMaterial
);

ring.rotation.x = Math.PI / 2;

ring.position.set(0, 0.55, -0.35);

scene.add(ring);

// --------------------------------------------------
// CONTROLS
// --------------------------------------------------

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.enableZoom = true;
controls.minDistance = 5;
controls.maxDistance = 10;

controls.enablePan = false;

controls.target.set(0, 0.55, 0);

// --------------------------------------------------
// RESIZE
// --------------------------------------------------

function resize() {

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

window.addEventListener('resize', resize);

// --------------------------------------------------
// ANIMATION
// --------------------------------------------------

const clock = new THREE.Clock();

function animate() {

    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    character.rotation.y =
        Math.sin(time * 0.35) * 0.08;

    ring.rotation.z =
        time * 0.08;

    controls.update();

    renderer.render(scene, camera);
}

animate();
