import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

/* =========================================================
   HERO THREE.JS (Clean Minimal Line Art / Black Outlines)
========================================================= */

export function initHero3D() {
  const container = document.getElementById("hero-3d");
  if (!container) return;

  container.innerHTML = "";

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 15);

  /* =====================================================
     LIGHTING (미니멀 라인 표현을 위해 최소한의 기본 조명)
  ===================================================== */
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  // 1. 배경 및 빛을 완전히 제거한 순백색(Clean White) 배경
  renderer.setClearColor(0xffffff, 1);

  container.appendChild(renderer.domElement);

  const group = new THREE.Group();
  scene.add(group);

  /* =====================================================
     1. 배경 공간 그리드 (기존보다 더 촘촘하게 간격 조정)
  ===================================================== */
  function createDenseGridGeometry(width, height, stepX, stepY, curveAmount = 0.01) {
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
  // 기존보다 간격을 좁혀서 더 촘촘하게 설정 (step 1.2)
  const stepX = 1.2, stepY = 1.2, curveFactor = 0.01;
  const denseGridGeo = createDenseGridGeometry(gridWidth, gridHeight, stepX, stepY, curveFactor);

  const gridMaterial = new THREE.LineBasicMaterial({
    color: 0xe0e0e0,
    transparent: true,
    opacity: 0.6,
  });

  gridGroup.add(new THREE.LineSegments(denseGridGeo, gridMaterial));
  scene.add(gridGroup);

  /* =====================================================
     5. 얇고 깔끔한 블랙 테두리 라인 머티리얼 (카카오 스타일 펜 라인)
  ===================================================== */
  const blackOutlineMat = new THREE.LineBasicMaterial({
    color: 0x111111,
    linewidth: 1, // 브라우저 지원에 따라 1px 실선
    transparent: true,
    opacity: 0.85,
  });

  /* =====================================================
     FONT LOADER & 3D OBJECTS CREATION
  ===================================================== */
  const loader = new FontLoader();

  loader.load(
    "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/fonts/helvetiker_bold.typeface.json",
    (font) => {
      // 2, 3, 4. U와 X 모두 3D 입체감을 가지되 효과를 빼고 라인으로만 구성 (X는 부드러운 곡선 곡면 반영)
      createLineArtLetter("U", font, -2.9, -0.65, -0.42, 0.92, 0, false);
      createLineArtLetter("X", font, 2.25, 0.55, 0.42, 0.88, 1.7, true);
      createLineArtLetter("X", font, -2.3, 3.8, 0.35, 0.52, 0.8, true);
      createLineArtLetter("X", font, 5.3, -3.2, 0.45, 0.55, 2.3, true);
    }
  );

  function createLineArtLetter(character, font, x, y, rotationY, scale, phase, isRoundedX) {
    const isU = character === "U";
    
    // 2, 3, 4. 3D 입체 구조를 가지면서 면 채우기 없이 외곽/입체 엣지 라인만 추출
    const geometryOptions = isU
      ? {
          font: font,
          size: 4.1,
          depth: 0.45,
          curveSegments: 16,
          bevelEnabled: true,
          bevelThickness: 0.15,
          bevelSize: 0.1,
          bevelSegments: 4,
        }
      : {
          font: font,
          size: 4.1,
          depth: 0.5,
          // 3. X는 너무 각지지 않게 베벨을 살짝 주어 모서리를 부드럽게 처리
          curveSegments: isRoundedX ? 12 : 1,
          bevelEnabled: isRoundedX,
          bevelThickness: 0.12,
          bevelSize: 0.1,
          bevelSegments: 4,
        };

    const geometry = new TextGeometry(character, geometryOptions);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    geometry.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, 0);

    const letterGroup = new THREE.Group();

    // 5. 입체 매쉬 대신 EdgesGeometry를 사용하여 깔끔한 얇은 블랙 라인 아트로 구성
    const edges = new THREE.EdgesGeometry(geometry, isRoundedX ? 35 : 20);
    const lineSegments = new THREE.LineSegments(edges, blackOutlineMat);
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
