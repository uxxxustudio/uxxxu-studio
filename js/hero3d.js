import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

/* =========================================================
   HERO THREE.JS (3D Dashed Wireframe Objects & Dense Grid)
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
  renderer.setClearColor(0xffffff, 1); // 순백색 배경

  container.appendChild(renderer.domElement);

  const group = new THREE.Group();
  scene.add(group);

  /* =====================================================
     1. 배경 공간 그리드 (촘촘한 점선 그리드)
  ===================================================== */
  function createDashedGridGeometry(width, height, stepX, stepY, curveAmount = 0.01) {
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
  const dashedGridGeo = createDashedGridGeometry(gridWidth, gridHeight, stepX, stepY, curveFactor);

  const gridMaterial = new THREE.LineDashedMaterial({
    color: 0xd0d5dd,
    dashSize: 0.15,
    gapSize: 0.1,
    transparent: true,
    opacity: 0.8,
  });

  const gridLines = new THREE.LineSegments(dashedGridGeo, gridMaterial);
  gridLines.computeLineDistances();
  gridGroup.add(gridLines);
  scene.add(gridGroup);

  /* =====================================================
     점선 입체 오브젝트 머티리얼 (카카오 스타일 블랙 점선)
  ===================================================== */
  const dashed3DMat = new THREE.LineDashedMaterial({
    color: 0x111111,
    dashSize: 0.12,
    gapSize: 0.08,
    transparent: true,
    opacity: 0.9,
  });

  /* =====================================================
     FONT LOADER & 3D 입체 점선 오브젝트 생성
  ===================================================== */
  const loader = new FontLoader();

  loader.load(
    "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/fonts/helvetiker_bold.typeface.json",
    (font) => {
      // U와 X 모두 3D 입체 두께(depth)를 가지면서 점선 와이어프레임으로 표현
      createDashed3DLetter("U", font, -2.9, -0.65, -0.42, 0.92, 0, false);
      createDashed3DLetter("X", font, 2.25, 0.55, 0.42, 0.88, 1.7, true);
      createDashed3DLetter("X", font, -2.3, 3.8, 0.35, 0.52, 0.8, true);
      createDashed3DLetter("X", font, 5.3, -3.2, 0.45, 0.55, 2.3, true);
    }
  );

  function createDashed3DLetter(character, font, x, y, rotationY, scale, phase, isRoundedX) {
    const isU = character === "U";
    
    // 3D 입체감을 위한 두께(depth)와 베벨 설정 유지
    const geometryOptions = isU
      ? {
          font: font,
          size: 4.1,
          depth: 0.45,
          curveSegments: 6,
          bevelEnabled: true,
          bevelThickness: 0.08,
          bevelSize: 0.05,
          bevelSegments: 2,
        }
      : {
          font: font,
          size: 4.1,
          depth: 0.45,
          curveSegments: isRoundedX ? 8 : 4,
          bevelEnabled: isRoundedX,
          bevelThickness: 0.08,
          bevelSize: 0.05,
          bevelSegments: 2,
        };

    const geometry = new TextGeometry(character, geometryOptions);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    geometry.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, 0);

    const letterGroup = new THREE.Group();

    // ★ 3D 입체 형태의 외곽 및 모서리 엣지만 추출하여 점선 적용
    const edges = new THREE.EdgesGeometry(geometry, 25);
    const lineSegments = new THREE.LineSegments(edges, dashed3DMat);
    lineSegments.computeLineDistances(); // 점선 렌더링에 필수
    
    letterGroup.add(lineSegments);

    letterGroup.position.set(x, y, 0);
    letterGroup.scale.setScalar(scale);
    letterGroup.rotation.y = rotationY;
    letterGroup.rotation.x = -0.08;
    letterGroup.userData = { baseX: x, baseY: y, baseRotationY: rotationY, phase: phase };
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
    });

    renderer.render(scene, camera);
  }

  resize();
  animate();
}
