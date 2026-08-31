import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// ======================================================
// BASIC SETUP
// ======================================================

const container = document.getElementById('character');

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    35,
    container.clientWidth / container.clientHeight,
    0.1,
    100
);

camera.position.set(0, 0, 8);


// ======================================================
// RENDERER
// ======================================================

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
    container.clientWidth,
    container.clientHeight
);

renderer.outputColorSpace =
    THREE.SRGBColorSpace;

container.appendChild(renderer.domElement);


// ======================================================
// MATERIAL
// 면 없음.
// 선만 사용.
// ======================================================

const whiteLine =
    new THREE.LineBasicMaterial({
        color: 0xdfeee5,
        transparent: true,
        opacity: 0.82
    });


const greenLine =
    new THREE.LineBasicMaterial({
        color: 0x65ff9b,
        transparent: true,
        opacity: 0.95
    });


// ======================================================
// LINE FUNCTION
// ======================================================

function createLine(
    points,
    material,
    closed = false
) {

    const geometry =
        new THREE.BufferGeometry();

    geometry.setFromPoints(
        points.map(
            point =>
                new THREE.Vector3(
                    point[0],
                    point[1],
                    point[2] || 0
                )
        )
    );

    const object = closed
        ? new THREE.LineLoop(
            geometry,
            material
        )
        : new THREE.Line(
            geometry,
            material
        );

    scene.add(object);

    return object;
}


// ======================================================
// ELLIPSE FUNCTION
// ======================================================

function createEllipse(
    centerX,
    centerY,
    radiusX,
    radiusY,
    z,
    material
) {

    const points = [];

    const segments = 80;

    for (let i = 0; i <= segments; i++) {

        const angle =
            Math.PI * 2 * i / segments;

        points.push([
            centerX +
                Math.cos(angle) * radiusX,

            centerY +
                Math.sin(angle) * radiusY,

            z
        ]);
    }

    return createLine(
        points,
        material,
        true
    );
}


// ======================================================
// CHARACTER GROUP
// ======================================================

const character =
    new THREE.Group();

character.position.set(
    0,
    0.15,
    0
);

scene.add(character);


// ======================================================
// HEAD OUTLINE
// ======================================================

const headPoints = [];

const headWidth = 1.42;
const headHeight = 1.72;

for (let i = 0; i <= 100; i++) {

    const angle =
        Math.PI * 2 * i / 100;

    const x =
        Math.cos(angle) *
        headWidth;

    const y =
        Math.sin(angle) *
        headHeight;

    headPoints.push([
        x,
        y + 0.55,
        0
    ]);
}

const head =
    createLine(
        headPoints,
        whiteLine,
        true
    );

character.add(head);

scene.remove(head);


// ======================================================
// HAIR TOP
// ======================================================

const hairPoints = [];

for (let i = 0; i <= 60; i++) {

    const angle =
        Math.PI * i / 60;

    const x =
        Math.cos(angle) * 1.42;

    const y =
        Math.sin(angle) * 0.86 + 1.68;

    hairPoints.push([
        x,
        y,
        0.04
    ]);
}

const hair =
    createLine(
        hairPoints,
        whiteLine
    );

character.add(hair);

scene.remove(hair);


// ======================================================
// HAIR LEFT
// ======================================================

const hairLeft =
    createLine([
        [-1.42, 1.68, 0.04],
        [-1.48, 1.30, 0.04],
        [-1.46, 0.90, 0.04],
        [-1.35, 0.48, 0.04],
        [-1.18, 0.22, 0.04]
    ], whiteLine);

character.add(hairLeft);

scene.remove(hairLeft);


// ======================================================
// HAIR RIGHT
// ======================================================

const hairRight =
    createLine([
        [1.42, 1.68, 0.04],
        [1.48, 1.30, 0.04],
        [1.46, 0.90, 0.04],
        [1.35, 0.48, 0.04],
        [1.18, 0.22, 0.04]
    ], whiteLine);

character.add(hairRight);

scene.remove(hairRight);


// ======================================================
// HAIR PART
// ======================================================

const hairPartLeft =
    createLine([
        [0, 2.54, 0.05],
        [-0.16, 2.30, 0.05],
        [-0.38, 2.06, 0.05]
    ], whiteLine);

character.add(hairPartLeft);

scene.remove(hairPartLeft);


const hairPartRight =
    createLine([
        [0, 2.54, 0.05],
        [0.18, 2.30, 0.05],
        [0.48, 2.08, 0.05]
    ], whiteLine);

character.add(hairPartRight);

scene.remove(hairPartRight);


// ======================================================
// GLASSES
// ======================================================

const glassesLeft =
    createEllipse(
        -0.58,
        0.98,
        0.63,
        0.48,
        0.20,
        greenLine
    );

character.add(glassesLeft);

scene.remove(glassesLeft);


const glassesRight =
    createEllipse(
        0.58,
        0.98,
        0.63,
        0.48,
        0.20,
        greenLine
    );

character.add(glassesRight);

scene.remove(glassesRight);


// ======================================================
// GLASSES BRIDGE
// ======================================================

const bridge =
    createLine([
        [-0.07, 0.98, 0.20],
        [0.07, 0.98, 0.20]
    ], greenLine);

character.add(bridge);

scene.remove(bridge);


// ======================================================
// GLASSES TEMPLES
// ======================================================

const templeLeft =
    createLine([
        [-1.17, 1.04, 0.18],
        [-1.40, 1.10, 0.08]
    ], greenLine);

character.add(templeLeft);

scene.remove(templeLeft);


const templeRight =
    createLine([
        [1.17, 1.04, 0.18],
        [1.40, 1.10, 0.08]
    ], greenLine);

character.add(templeRight);

scene.remove(templeRight);


// ======================================================
// EYES
// ======================================================

const eyeLeft =
    createEllipse(
        -0.55,
        0.98,
        0.25,
        0.34,
        0.12,
        whiteLine
    );

character.add(eyeLeft);

scene.remove(eyeLeft);


const eyeRight =
    createEllipse(
        0.55,
        0.98,
        0.25,
        0.34,
        0.12,
        whiteLine
    );

character.add(eyeRight);

scene.remove(eyeRight);


// ======================================================
// NOSE
// ======================================================

const nose =
    createLine([
        [0, 0.86, 0.22],
        [-0.08, 0.58, 0.22],
        [0, 0.46, 0.22],
        [0.08, 0.58, 0.22],
        [0, 0.86, 0.22]
    ], whiteLine);

character.add(nose);

scene.remove(nose);


// ======================================================
// MOUTH
// ======================================================

const mouthPoints = [];

for (let i = 0; i <= 40; i++) {

    const angle =
        Math.PI * i / 40;

    mouthPoints.push([
        Math.cos(angle) * 0.38,
        0.08 -
            Math.sin(angle) * 0.13,
        0.22
    ]);
}

const mouth =
    createLine(
        mouthPoints,
        whiteLine
    );

character.add(mouth);

scene.remove(mouth);


// ======================================================
// NECK
// ======================================================

const neckLeft =
    createLine([
        [-0.38, -0.85, 0],
        [-0.36, -1.15, 0],
        [-0.28, -1.40, 0]
    ], whiteLine);

character.add(neckLeft);

scene.remove(neckLeft);


const neckRight =
    createLine([
        [0.38, -0.85, 0],
        [0.36, -1.15, 0],
        [0.28, -1.40, 0]
    ], whiteLine);

character.add(neckRight);

scene.remove(neckRight);


// ======================================================
// SHOULDERS
// ======================================================

const shoulderPoints = [];

for (let i = 0; i <= 80; i++) {

    const angle =
        Math.PI * i / 80;

    shoulderPoints.push([
        Math.cos(angle) * 1.65,
        -1.55 +
            Math.sin(angle) * 0.62,
        -0.02
    ]);
}

const shoulders =
    createLine(
        shoulderPoints,
        whiteLine
    );

character.add(shoulders);

scene.remove(shoulders);


// ======================================================
// BODY LEFT
// ======================================================

const bodyLeft =
    createLine([
        [-1.65, -1.55, -0.02],
        [-1.58, -1.90, -0.02],
        [-1.43, -2.15, -0.02],
        [-1.20, -2.35, -0.02]
    ], whiteLine);

character.add(bodyLeft);

scene.remove(bodyLeft);


// ======================================================
// BODY RIGHT
// ======================================================

const bodyRight =
    createLine([
        [1.65, -1.55, -0.02],
        [1.58, -1.90, -0.02],
        [1.43, -2.15, -0.02],
        [1.20, -2.35, -0.02]
    ], whiteLine);

character.add(bodyRight);

scene.remove(bodyRight);


// ======================================================
// OUTER CIRCLE
// ======================================================

const ringPoints = [];

const ringRadius = 2.65;

for (let i = 0; i <= 160; i++) {

    const angle =
        Math.PI * 2 * i / 160;

    ringPoints.push([
        Math.cos(angle) * ringRadius,
        Math.sin(angle) * ringRadius,
        -0.35
    ]);
}

const ring =
    createLine(
        ringPoints,
        greenLine,
        true
    );


// ======================================================
// CONTROLS
// ======================================================

const controls =
    new OrbitControls(
        camera,
        renderer.domElement
    );

controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.enablePan = false;

controls.enableZoom = true;

controls.minDistance = 5;
controls.maxDistance = 10;

controls.target.set(
    0,
    0.25,
    0
);


// ======================================================
// RESIZE
// ======================================================

window.addEventListener(
    'resize',
    () => {

        const width =
            container.clientWidth;

        const height =
            container.clientHeight;

        camera.aspect =
            width / height;

        camera.updateProjectionMatrix();

        renderer.setSize(
            width,
            height
        );
    }
);


// ======================================================
// ANIMATION
// ======================================================

const clock =
    new THREE.Clock();

function animate() {

    requestAnimationFrame(
        animate
    );

    const time =
        clock.getElapsedTime();

    character.rotation.y =
        Math.sin(time * 0.35) * 0.05;

    character.rotation.x =
        Math.sin(time * 0.25) * 0.015;

    ring.rotation.z =
        time * 0.06;

    controls.update();

    renderer.render(
        scene,
        camera
    );
}

animate();
