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

camera.position.set(0, 0.15, 7.2);

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

const ambient = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 3);
keyLight.position.set(-3, 5, 6);
scene.add(keyLight);

const greenLight = new THREE.PointLight(0x25ff88, 5, 10);
greenLight.position.set(2.5, 1.5, 3);
scene.add(greenLight);

const rimLight = new THREE.PointLight(0xffffff, 2.5, 8);
rimLight.position.set(-3, 1, -2);
scene.add(rimLight);


// --------------------------------------------------
// MATERIALS
// --------------------------------------------------

const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0x8d918e,
    roughness: 0.65,
    metalness: 0.05
});

const hairMaterial = new THREE.MeshStandardMaterial({
    color: 0x101111,
    roughness: 0.4,
    metalness: 0.15
});

const glassesMaterial = new THREE.MeshStandardMaterial({
    color: 0x080909,
    roughness: 0.2,
    metalness: 0.5,
    transparent: true,
    opacity: 0.92
});

const greenMaterial = new THREE.MeshStandardMaterial({
    color: 0x35f58b,
    emissive: 0x0bcf62,
    emissiveIntensity: 2.2,
    roughness: 0.3,
    metalness: 0.2
});

const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x151717,
    roughness: 0.45,
    metalness: 0.25
});


// --------------------------------------------------
// CHARACTER GROUP
// --------------------------------------------------

const character = new THREE.Group();
character.position.y = -0.15;
scene.add(character);


// --------------------------------------------------
// HELPER
// --------------------------------------------------

function addMesh(geometry, material, position, scale = [1, 1, 1]) {

    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.set(
        position[0],
        position[1],
        position[2]
    );

    mesh.scale.set(
        scale[0],
        scale[1],
        scale[2]
    );

    character.add(mesh);

    return mesh;
}


// --------------------------------------------------
// HAIR BACK
// --------------------------------------------------

// 뒤쪽 큰 머리카락 실루엣
const hairBack = addMesh(
    new THREE.SphereGeometry(1, 64, 48),
    hairMaterial,
    [0, 0.45, -0.15],
    [1.72, 2.0, 0.72]
);


// 양쪽으로 내려오는 머리카락
const hairLeft = addMesh(
    new THREE.SphereGeometry(0.75, 48, 32),
    hairMaterial,
    [-1.28, -0.15, -0.05],
    [0.7, 1.45, 0.65]
);

const hairRight = addMesh(
    new THREE.SphereGeometry(0.75, 48, 32),
    hairMaterial,
    [1.28, -0.15, -0.05],
    [0.7, 1.45, 0.65]
);


// --------------------------------------------------
// FACE
// --------------------------------------------------

const face = addMesh(
    new THREE.SphereGeometry(1, 64, 48),
    skinMaterial,
    [0, 0.45, 0.55],
    [1.38, 1.52, 0.82]
);


// --------------------------------------------------
// NECK
// --------------------------------------------------

const neck = addMesh(
    new THREE.CylinderGeometry(0.46, 0.55, 1.15, 48),
    skinMaterial,
    [0, -0.78, 0.25],
    [1, 1, 0.85]
);


// --------------------------------------------------
// SHOULDERS / UPPER BODY
// --------------------------------------------------

const shoulders = addMesh(
    new THREE.SphereGeometry(1, 64, 40),
    darkMaterial,
    [0, -1.38, 0],
    [2.05, 0.72, 0.72]
);


// 조금 더 자연스러운 어깨 연결
const shoulderLeft = addMesh(
    new THREE.SphereGeometry(0.75, 48, 32),
    darkMaterial,
    [-1.35, -1.3, 0.05],
    [1.0, 0.7, 0.72]
);

const shoulderRight = addMesh(
    new THREE.SphereGeometry(0.75, 48, 32),
    darkMaterial,
    [1.35, -1.3, 0.05],
    [1.0, 0.7, 0.72]
);


// --------------------------------------------------
// EYES
// --------------------------------------------------

const eyeGeometry = new THREE.SphereGeometry(0.43, 48, 32);

const leftEye = addMesh(
    eyeGeometry,
    darkMaterial,
    [-0.55, 0.55, 1.28],
    [0.82, 1.12, 0.32]
);

const rightEye = addMesh(
    eyeGeometry,
    darkMaterial,
    [0.55, 0.55, 1.28],
    [0.82, 1.12, 0.32]
);


// --------------------------------------------------
// NOSE
// --------------------------------------------------

const nose = addMesh(
    new THREE.SphereGeometry(0.22, 32, 24),
    skinMaterial,
    [0, 0.08, 1.35],
    [0.72, 1.05, 0.75]
);


// --------------------------------------------------
// MOUTH
// --------------------------------------------------

const mouthCurve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-0.38, -0.36, 1.32),
    new THREE.Vector3(0, -0.52, 1.42),
    new THREE.Vector3(0.38, -0.36, 1.32)
);

const mouthGeometry = new THREE.TubeGeometry(
    mouthCurve,
    24,
    0.035,
    10,
    false
);

const mouth = new THREE.Mesh(
    mouthGeometry,
    greenMaterial
);

character.add(mouth);


// --------------------------------------------------
// EYEBROWS
// --------------------------------------------------

const browMaterial = new THREE.MeshStandardMaterial({
    color: 0x151717,
    roughness: 0.5
});

function createBrow(x, rotationZ) {

    const brow = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.075, 0.55, 8, 16),
        browMaterial
    );

    brow.position.set(x, 1.02, 1.28);
    brow.rotation.z = rotationZ;

    character.add(brow);
}

createBrow(-0.55, -0.22);
createBrow(0.55, 0.22);


// --------------------------------------------------
// GLASSES
// --------------------------------------------------

const glasses = new THREE.Group();
glasses.position.set(0, 0.56, 1.47);
character.add(glasses);


// 안경 렌즈 프레임
function createLens(x) {

    const frame = new THREE.Mesh(
        new THREE.TorusGeometry(
            0.52,
            0.065,
            12,
            64
        ),
        greenMaterial
    );

    frame.scale.set(1.18, 0.82, 1);
    frame.position.x = x;

    glasses.add(frame);

    // 렌즈
    const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(
            0.47,
            0.47,
            0.025,
            48
        ),
        glassesMaterial
    );

    lens.rotation.x = Math.PI / 2;
    lens.scale.set(1.18, 0.82, 1);
    lens.position.set(x, 0, -0.015);

    glasses.add(lens);
}

createLens(-0.58);
createLens(0.58);


// 안경 브릿지
const bridge = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.055, 0.42, 8, 16),
    greenMaterial
);

bridge.rotation.z = Math.PI / 2;
bridge.position.set(0, 0.02, 0);

glasses.add(bridge);


// 안경 다리
const templeGeometry = new THREE.CapsuleGeometry(
    0.045,
    1.15,
    8,
    12
);

const templeLeft = new THREE.Mesh(
    templeGeometry,
    greenMaterial
);

templeLeft.rotation.y = Math.PI / 2;
templeLeft.position.set(-1.05, 0, -0.05);
glasses.add(templeLeft);

const templeRight = new THREE.Mesh(
    templeGeometry,
    greenMaterial
);

templeRight.rotation.y = Math.PI / 2;
templeRight.position.set(1.05, 0, -0.05);
glasses.add(templeRight);


// --------------------------------------------------
// HAIR FRONT / BANGS
// --------------------------------------------------

const bangMaterial = hairMaterial;


// 왼쪽 앞머리
const bangLeft = addMesh(
    new THREE.SphereGeometry(0.72, 48, 32),
    bangMaterial,
    [-0.72, 1.35, 0.82],
    [0.72, 0.65, 0.45]
);

bangLeft.rotation.z = -0.38;


// 오른쪽 앞머리
const bangRight = addMesh(
    new THREE.SphereGeometry(0.72, 48, 32),
    bangMaterial,
    [0.72, 1.4, 0.82],
    [0.72, 0.58, 0.45]
);

bangRight.rotation.z = 0.38;


// 가운데 포인트
const bangCenter = addMesh(
    new THREE.SphereGeometry(0.5, 40, 24),
    bangMaterial,
    [0, 1.62, 0.8],
    [0.65, 0.45, 0.42]
);


// --------------------------------------------------
// LARGE ORBIT RING
// --------------------------------------------------

const ringGroup = new THREE.Group();
ringGroup.position.set(0, 0.05, -0.35);
character.add(ringGroup);

const ring = new THREE.Mesh(
    new THREE.TorusGeometry(
        2.75,
        0.035,
        16,
        160
    ),
    greenMaterial
);

ring.rotation.x = Math.PI / 2;
ringGroup.add(ring);


// 두 번째 아주 약한 와이어 링
const outerRing = new THREE.Mesh(
    new THREE.TorusGeometry(
        2.83,
        0.012,
        8,
        160
    ),
    new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.18
    })
);

outerRing.rotation.x = Math.PI / 2;
ringGroup.add(outerRing);


// --------------------------------------------------
// WIRE DETAIL
// --------------------------------------------------

function addWireframe(mesh, opacity = 0.16) {

    const edges = new THREE.EdgesGeometry(mesh.geometry);

    const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity
        })
    );

    line.position.copy(mesh.position);
    line.rotation.copy(mesh.rotation);
    line.scale.copy(mesh.scale);

    character.add(line);

    return line;
}


// 얼굴과 머리에 아주 약한 와이어 디테일
addWireframe(face, 0.10);
addWireframe(hairBack, 0.07);
addWireframe(shoulders, 0.08);


// --------------------------------------------------
// SUBTLE FLOATING PARTICLES
// --------------------------------------------------

const particleGeometry = new THREE.BufferGeometry();
const particleCount = 450;

const particlePositions = new Float32Array(
    particleCount * 3
);

for (let i = 0; i < particleCount; i++) {

    const radius = 4.2 + Math.random() * 2;

    const angle = Math.random() * Math.PI * 2;

    particlePositions[i * 3] =
        Math.cos(angle) * radius;

    particlePositions[i * 3 + 1] =
        (Math.random() - 0.5) * 5;

    particlePositions[i * 3 + 2] =
        (Math.random() - 0.5) * 2 - 1;
}

particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(
        particlePositions,
        3
    )
);

const particles = new THREE.Points(
    particleGeometry,
    new THREE.PointsMaterial({
        color: 0x6affaa,
        size: 0.018,
        transparent: true,
        opacity: 0.35
    })
);

scene.add(particles);


// --------------------------------------------------
// CONTROLS
// --------------------------------------------------

const controls = new OrbitControls(
    camera,
    renderer.domElement
);

controls.enableDamping = true;
controls.dampingFactor = 0.06;

controls.enablePan = false;

controls.minDistance = 5;
controls.maxDistance = 9;

controls.minPolarAngle = Math.PI * 0.38;
controls.maxPolarAngle = Math.PI * 0.62;

controls.target.set(0, 0, 0.2);


// --------------------------------------------------
// MOUSE PARALLAX
// --------------------------------------------------

let mouseX = 0;
let mouseY = 0;

window.addEventListener('pointermove', (event) => {

    mouseX =
        (event.clientX / window.innerWidth - 0.5);

    mouseY =
        (event.clientY / window.innerHeight - 0.5);

});


// --------------------------------------------------
// RESIZE
// --------------------------------------------------

window.addEventListener('resize', () => {

    const width = container.clientWidth;
    const height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
});


// --------------------------------------------------
// ANIMATION
// --------------------------------------------------

const clock = new THREE.Clock();

function animate() {

    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    // 아주 미세한 부유감
    character.position.y =
        -0.15 + Math.sin(time * 0.7) * 0.025;

    // 마우스에 반응
    character.rotation.y +=
        (mouseX * 0.22 - character.rotation.y) * 0.025;

    character.rotation.x +=
        (-mouseY * 0.08 - character.rotation.x) * 0.025;

    // 링은 천천히 회전
    ringGroup.rotation.z =
        time * 0.08;

    particles.rotation.y =
        time * 0.015;

    controls.update();

    renderer.render(scene, camera);
}

animate();
