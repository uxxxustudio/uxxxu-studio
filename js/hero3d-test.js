import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = document.getElementById('character');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);

const camera = new THREE.PerspectiveCamera(
    35,
    container.clientWidth / container.clientHeight,
    0.1,
    100
);

camera.position.set(0, 0.8, 8.5);

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


/* -------------------------
   LIGHT
------------------------- */

const ambient = new THREE.AmbientLight(0xffffff, 1.8);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(3, 5, 6);
scene.add(keyLight);

const greenLight = new THREE.PointLight(0x27e878, 3, 8);
greenLight.position.set(0, 1.5, 3);
scene.add(greenLight);


/* -------------------------
   MATERIALS
------------------------- */

const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x555555,
    roughness: 0.72,
    metalness: 0.05
});

const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x101010,
    roughness: 0.55,
    metalness: 0.1
});

const greenMaterial = new THREE.MeshBasicMaterial({
    color: 0x25e879
});


/* -------------------------
   CHARACTER
------------------------- */

const character = new THREE.Group();
scene.add(character);


/* HEAD */

const head = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 48, 32),
    bodyMaterial
);

head.scale.set(1, 1.08, 0.9);
head.position.y = 1.15;
character.add(head);


/* HAIR */

const hair = new THREE.Mesh(
    new THREE.SphereGeometry(1.08, 48, 24),
    darkMaterial
);

hair.scale.set(1.01, 0.55, 0.93);
hair.position.set(0, 1.85, -0.03);
character.add(hair);


/* EYES */

const eyeGeometry = new THREE.SphereGeometry(0.27, 32, 24);

const leftEye = new THREE.Mesh(eyeGeometry, darkMaterial);
leftEye.scale.set(0.8, 1.25, 0.45);
leftEye.position.set(-0.38, 1.28, 0.82);
character.add(leftEye);

const rightEye = new THREE.Mesh(eyeGeometry, darkMaterial);
rightEye.scale.set(0.8, 1.25, 0.45);
rightEye.position.set(0.38, 1.28, 0.82);
character.add(rightEye);


/* NOSE */

const nose = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 24, 16),
    bodyMaterial
);

nose.scale.set(0.8, 1.3, 0.7);
nose.position.set(0, 0.95, 0.9);
character.add(nose);


/* BODY */

const body = new THREE.Mesh(
    new THREE.SphereGeometry(1.45, 48, 32),
    bodyMaterial
);

body.scale.set(1.05, 0.78, 0.72);
body.position.y = -0.25;
character.add(body);


/* NECK / COLLAR */

const collar = new THREE.Mesh(
    new THREE.TorusGeometry(1.05, 0.035, 16, 96),
    greenMaterial
);

collar.rotation.x = Math.PI / 2;
collar.position.y = 0.45;
character.add(collar);


/* LOWER RING */

const lowerRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.38, 0.055, 16, 96),
    greenMaterial
);

lowerRing.rotation.x = Math.PI / 2;
lowerRing.position.y = -0.48;
character.add(lowerRing);


/* -------------------------
   SOFT OUTER CIRCLE
------------------------- */

const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.7, 0.018, 16, 160),
    new THREE.MeshBasicMaterial({
        color: 0x1c1c1c,
        transparent: true,
        opacity: 0.75
    })
);

outerRing.rotation.x = Math.PI / 2;
outerRing.position.y = 0.65;
character.add(outerRing);


/* -------------------------
   CONTROLS
------------------------- */

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.enableZoom = false;

controls.minPolarAngle = Math.PI * 0.38;
controls.maxPolarAngle = Math.PI * 0.62;


/* -------------------------
   RESIZE
------------------------- */

function resize() {

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

window.addEventListener('resize', resize);


/* -------------------------
   ANIMATION
------------------------- */

const clock = new THREE.Clock();

function animate() {

    requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();

    character.rotation.y = Math.sin(elapsed * 0.35) * 0.12;

    controls.update();

    renderer.render(scene, camera);
}

animate();
