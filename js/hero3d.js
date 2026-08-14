import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

/* =========================================================
   HERO THREE.JS (Clean 2-Point U Flow & X Sweep)
========================================================= */

export function initHero3D() {
  const container = document.getElementById("hero-3d");
  if (!container) return;

  container.innerHTML = "";

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 15);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0xffffff, 1);

  container.appendChild(renderer.domElement);

  const group = new THREE.Group();
  scene.add(group);

  /* =====================================================
     1. 배경 공간 그리드 (실선)
  ===================================================== */
  function createSolidGridGeometry(width, height, stepX, stepY, curveAmount = 0.01) {
    const points = [];
    const resolution = 30;

    for (let x = -width / 2; x <= width / 2; x += stepX) {
      for (let i = 0; i < resolution; i++) {
        const t1 = i / resolution, t2 = (i + 1) / resolution;
        const y1 = -height / 2 + t1 * height, y2 = -height / 2 + t2 * height;
        const z1 = (x * x * 0.8 + y1 * y1) * curveAmount - 3.0;
        const z2 = (x * x * 0.8 + y2 * y2) * curveAmount - 3.0;
        points.push(x, y1, z1, x, y2, z2);
      }
    }

    for (let y = -height / 2; y <= height / 2; y += stepY) {
      for (let i = 0; i < resolution; i++) {
        const t1 = i / resolution, t2 = (i + 1) / resolution;
        const x1 = -width / 2 + t1 * width, x2 = -width / 2 + t2 * width;
        const z1 = (x1 * x1 * 0.8 + y * y) * curveAmount - 3.0;
        const z2 = (x2 * x2 * 0.8 + y * y) * curveAmount - 3.0;
        points.push(x1, y, z1, x2, y, z2);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }

  const gridGroup = new THREE.Group();
  gridGroup.position.set(0, 0, -3);

  const gridWidth = 36, gridHeight = 22;
  const stepX = 1.2, stepY = 1.2, curveFactor = 0.01;
  const solidGridGeo = createSolidGridGeometry(gridWidth, gridHeight, stepX, stepY, curveFactor);

  const gridMaterial = new THREE.LineBasicMaterial({
    color: 0xe5e7eb,
    transparent: true,
    opacity: 0.5,
  });

  const gridLines = new THREE.LineSegments(solidGridGeo, gridMaterial);
  gridGroup.add(gridLines);
  scene.add(gridGroup);

  /* =====================================================
     3D 오브젝트 라인 재질 (묵직한 블랙 외곽선)
  ===================================================== */
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x111111,
    transparent: false,
    opacity: 1.0,
  });

  /* =====================================================
     FONT LOADER & 오브젝트 생성
  ===================================================== */
  const loader = new FontLoader();

  loader.load(
    "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/fonts/helvetiker_bold.typeface.json",
    (font) => {
      createLetterMesh("U", font, -2.9, -0.65, -0.42, 0.92, 0.0, true);
      createLetterMesh("X", font, 2.25, 0.55, 0.42, 0.88, 1.8, false);
      createLetterMesh("X", font, -2.3, 3.8, 0.35, 0.52, 3.6, false);
      createLetterMesh("X", font, 5.3, -3.2, 0.45, 0.55, 5.4, false);
    }
  );

  function createLetterMesh(character, font, x, y, rotationY, scale, timeOffset, isU) {
    const geomOpts = { font: font, size: 4.1, depth: 0.38, curveSegments: isU ? 24 : 6, bevelEnabled: false };

    const geometry = new TextGeometry(character, geomOpts);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    geometry.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, 0);

    const letterGroup = new THREE.Group();

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOffset: { value: timeOffset },
        uIsU: { value: isU ? 1.0 : 0.0 },
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
          vPosition = position;
          vNormal = normal;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uOffset;
        uniform float uIsU;
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          if (abs(vNormal.z) > 0.1) {
            discard; 
          }

          float beam = 0.0;

          if (uIsU > 0.5) {
            // 깔끔한 2개 포인트 (좌우 기둥에 각각 반대 방향으로 흐르는 형태)
            float sideDir = (vPosition.x < 0.0) ? 1.0 : -1.0;
            float flow = mod((vPosition.y * 0.2) + (uTime * 0.3 * sideDir) + (uOffset * 0.2), 1.0);
            float distFromCenter = abs(flow - 0.5);
            beam = smoothstep(0.12, 0.0, distFromCenter);
          } else {
            // X자 글자
            float angle = atan(vPosition.y, vPosition.x);
            float sweep = mod((angle / 6.28318) - (uTime * 0.15) + (uOffset * 0.1), 1.0);
            float distFromCenter = abs(sweep - 0.5);
            beam = smoothstep(0.12, 0.0, distFromCenter);
          }

          vec3 baseColor = vec3(0.04, 0.04, 0.04);
          vec3 neonGreen = vec3(0.12, 0.95, 0.45);

          vec3 finalColor = mix(baseColor, neonGreen, beam);
          float alpha = 0.08 + beam * 0.92;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const fillMesh = new THREE.Mesh(geometry, material);
    letterGroup.add(fillMesh);

    const edges = new THREE.EdgesGeometry(geometry, isU ? 25 : 15);
    const lineSegments = new THREE.LineSegments(edges, lineMat);
    letterGroup.add(lineSegments);

    letterGroup.position.set(x, y, 0);
    letterGroup.scale.setScalar(scale);
    letterGroup.rotation.y = rotationY;
    letterGroup.rotation.x = -0.08;
    letterGroup.userData = { baseX: x, baseY: y, baseRotationY: rotationY, material: material };
    group.add(letterGroup);
  }

  /* =====================================================
     ANIMATION LOOP
  ===================================================== */
  const target = { x: 0, y: 0 };
  const mouse = { x: 0, y: 0 };

  window.addEventListener(
    "mousemove",
    (e) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = -(e.clientY / window.innerHeight) * 2 + 1;
    },
    { passive: true }
  );

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;

    const isMobile = window.innerWidth < 768;
    camera.aspect = width / height;
    camera.position.z = isMobile ? 18.5 : 15;
    camera.updateProjectionMatrix();

    group.scale.setScalar(isMobile ? 0.68 : 1.0);
    renderer.setSize(width, height, false);
  }

  window.addEventListener("resize", resize);

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    mouse.x += (target.x - mouse.x) * 0.08;
    mouse.y += (target.y - mouse.y) * 0.08;

    gridGroup.position.x = -mouse.x * 0.2;
    gridGroup.position.y = -mouse.y * 0.15;

    group.children.forEach((obj, index) => {
      const p = obj.userData;
      obj.position.x = p.baseX + Math.sin(time * 0.4 + index) * 0.06;
      obj.position.y = p.baseY + Math.cos(time * 0.5 + index) * 0.08;
      obj.rotation.y = p.baseRotationY + mouse.x * 0.2;
      obj.rotation.x = -0.08 - mouse.y * 0.1;

      if (p.material) {
        p.material.uniforms.uTime.value = time;
      }
    });

    renderer.render(scene, camera);
  }

  resize();
  animate();
}
