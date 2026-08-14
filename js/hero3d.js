import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

/* =========================================================
   HERO THREE.JS (Clean 3D Wireframe + Varied Light Length, Speed & Opacity)
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
    opacity: 0.6,
  });

  const gridLines = new THREE.LineSegments(solidGridGeo, gridMaterial);
  gridGroup.add(gridLines);
  scene.add(gridGroup);

  /* =====================================================
     3D 오브젝트 라인 재질
  ===================================================== */
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x111111,
    transparent: true,
    opacity: 0.85,
  });

  /* =====================================================
     FONT LOADER & 오브젝트별 개별 길이, 속도, 투명도 설정
  ===================================================== */
  const loader = new FontLoader();

  loader.load(
    "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/fonts/helvetiker_bold.typeface.json",
    (font) => {
      // 파라미터: 문자, 폰트, x, y, 회전Y, 스케일, 위상, 속도(speed), 빛 길이(length), 투명도(opacity)
      createUniqueSweepLetter("U", font, -2.9, -0.65, -0.42, 0.92, 0.0, 0.55, 1.8, 0.35); // 크고 부드럽고 은은함
      createUniqueSweepLetter("X", font, 2.25, 0.55, 0.42, 0.88, 1.4, 1.10, 0.9,  0.50); // 중간 크기, 빠르고 선명함
      createUniqueSweepLetter("X", font, -2.3, 3.8, 0.35, 0.52, 2.2, 0.35, 2.5,  0.25); // 매우 길고 아주 느리며 투명함
      createUniqueSweepLetter("X", font, 5.3, -3.2, 0.45, 0.55, 0.8, 0.85, 0.6,  0.42); // 짧고 날렵함
    }
  );

  function createUniqueSweepLetter(character, font, x, y, rotationY, scale, phase, speed, length, maxOpacity) {
    const isU = character === "U";
    
    const geomOpts = isU
      ? { font: font, size: 4.1, depth: 0.35, curveSegments: 24, bevelEnabled: false }
      : { font: font, size: 4.1, depth: 0.35, curveSegments: 6, bevelEnabled: false };

    const geometry = new TextGeometry(character, geomOpts);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    geometry.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, 0);

    const letterGroup = new THREE.Group();

    // ★ 빛의 길이, 속도, 투명도를 오브젝트별로 다르게 제어하는 커스텀 셰이더
    const sweepMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouseX: { value: 0 },
        uMouseY: { value: 0 },
        uPhase: { value: phase },
        uSpeed: { value: speed },
        uLength: { value: length },
        uMaxOpacity: { value: maxOpacity },
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uMouseX;
        uniform float uMouseY;
        uniform float uPhase;
        uniform float uSpeed;
        uniform float uLength;
        uniform float uMaxOpacity;
        varying vec3 vPosition;

        void main() {
          // 개별 속도와 위상을 적용한 흐름 시간
          float t = uTime * uSpeed + uPhase;
          
          // 위치 좌표를 활용한 빗살무늬/스캔 라인 생성
          float coord = vPosition.x * 0.6 + vPosition.y * 0.6;
          
          // uLength 값에 따라 빛의 길이와 퍼짐 정도가 다름
          float wave = sin(coord * uLength - t * 2.0);
          float glow = smoothstep(0.4, 0.96, wave);

          // 싱그러운 민트/그린 톤
          vec3 greenColor = vec3(0.12, 0.88, 0.45);
          
          // 개별 지정된 투명도(uMaxOpacity) 적용
          float alpha = glow * uMaxOpacity;

          gl_FragColor = vec4(greenColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const fillMesh = new THREE.Mesh(geometry, sweepMaterial);
    letterGroup.add(fillMesh);

    // 기존의 깔끔한 단일 라인 와이어프레임 유지
    const edges = new THREE.EdgesGeometry(geometry, isU ? 25 : 15);
    const lineSegments = new THREE.LineSegments(edges, lineMat);
    letterGroup.add(lineSegments);

    letterGroup.position.set(x, y, 0);
    letterGroup.scale.setScalar(scale);
    letterGroup.rotation.y = rotationY;
    letterGroup.rotation.x = -0.08;
    letterGroup.userData = { baseX: x, baseY: y, baseRotationY: rotationY, phase: phase, material: sweepMaterial };
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

    group.children.forEach((obj) => {
      const p = obj.userData;
      obj.position.x = p.baseX + Math.sin(time * 0.55 + p.phase) * 0.08;
      obj.position.y = p.baseY + Math.cos(time * 0.7 + p.phase) * 0.1;
      obj.rotation.y = p.baseRotationY + mouse.x * 0.2;
      obj.rotation.x = -0.08 - mouse.y * 0.1;

      if (p.material) {
        p.material.uniforms.uTime.value = time;
        p.material.uniforms.uMouseX.value = mouse.x;
        p.material.uniforms.uMouseY.value = mouse.y;
      }
    });

    renderer.render(scene, camera);
  }

  resize();
  animate();
}
