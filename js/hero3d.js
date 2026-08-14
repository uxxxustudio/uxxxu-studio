import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

/* =========================================================
   HERO THREE.JS (Heavy Matte Metallic Graphite Look)
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
     1. 배경 공간 그리드 (실선, 은은한 톤)
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
     3D 오브젝트 기본 매트 머티리얼 (매트 블랙 베이스)
  ===================================================== */
  const baseMat = new THREE.MeshPhysicalMaterial({
    color: 0x111111,
    roughness: 0.88,
    metalness: 0.95,
    clearcoat: 0.3,
    clearcoatRoughness: 0.5,
    emissive: 0x000000,
  });

  /* =====================================================
     FONT LOADER & 묵직한 매트 그라파이트 머티리얼 설정
  ===================================================== */
  const loader = new FontLoader();

  loader.load(
    "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/fonts/helvetiker_bold.typeface.json",
    (font) => {
      createHeavyMetallicLetter("U", font, -2.9, -0.65, -0.42, 0.92, 0.0, 0.5);
      createHeavyMetallicLetter("X", font, 2.25, 0.55, 0.42, 0.88, 1.8, 0.6); // 가운데 X
      createHeavyMetallicLetter("X", font, -2.3, 3.8, 0.35, 0.52, 3.6, 0.4);
      createHeavyMetallicLetter("X", font, 5.3, -3.2, 0.45, 0.55, 5.4, 0.5);
    }
  );

  function createHeavyMetallicLetter(character, font, x, y, rotationY, scale, timeOffset, roughnessVal) {
    const isU = character === "U";
    
    const geomOpts = isU
      ? { font: font, size: 4.1, depth: 0.38, curveSegments: 24, bevelEnabled: false }
      : { font: font, size: 4.1, depth: 0.38, curveSegments: 6, bevelEnabled: false };

    const geometry = new TextGeometry(character, geomOpts);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    geometry.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, 0);

    const letterGroup = new THREE.Group();

    // ★ 무게감 있는 매트 그라파이트 재질 셰이더 (투명도 제거)
    const matteMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouseX: { value: 0 },
        uMouseY: { value: 0 },
        uOffset: { value: timeOffset },
        uRoughness: { value: roughnessVal },
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
        uniform float uMouseX;
        uniform float uMouseY;
        uniform float uOffset;
        uniform float uRoughness;
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          // 묵직한 그라파이트 및 딥 매트 블랙 베이스 톤
          vec3 graphiteColor = vec3(0.08, 0.09, 0.10);
          vec3 deepBlack = vec3(0.03, 0.03, 0.03);
          
          // 미세한 매트 그라데이션 베이스
          vec3 baseColor = mix(deepBlack, graphiteColor, length(vPosition.xy) * 0.05);

          // 순차적인 페이드 인/아웃 (오브젝트가 어둠 속에서 묵직하게 떠오름)
          float cycle = sin(uTime * 0.5 + uOffset);
          float opacityVal = smoothstep(-0.3, 1.0, cycle) * 0.98 + 0.02;

          // 마우스 연동 미세 하이라이트 (형광펜 아님, 은은한 스펙큘러)
          vec2 mousePos = vec2(uMouseX * 4.0, uMouseY * 4.0);
          float dist = distance(vPosition.xy, mousePos);
          float mouseHighlight = max(0.0, 1.0 - dist * 0.3) * 0.15 * (1.0 - uRoughness);

          // 차가운 톤의 림 라이트 (깊이감 강조)
          float rim = 1.0 - max(0.0, dot(vNormal, vec3(0.0, 0.0, 1.0)));
          rim = pow(rim, 5.0) * 0.2;

          vec3 finalColor = baseColor + mouseHighlight + rim;
          
          // 불투명하게 설정하여 무게감 극대화
          gl_FragColor = vec4(finalColor, opacityVal);
        }
      `,
      transparent: true, // 순차적 등장을 위해 투명 모드는 유지하되 불투명도 높임
      side: THREE.DoubleSide,
      depthWrite: true,
    });

    const fillMesh = new THREE.Mesh(geometry, matteMaterial);
    letterGroup.add(fillMesh);

    // 기존의 깔끔한 단일 라인 와이어프레임 유지 (윤곽을 묵직하게 잡아줌)
    const edges = new THREE.EdgesGeometry(geometry, isU ? 25 : 15);
    const lineSegments = new THREE.LineSegments(edges, lineMat);
    letterGroup.add(lineSegments);

    letterGroup.position.set(x, y, 0);
    letterGroup.scale.setScalar(scale);
    letterGroup.rotation.y = rotationY;
    letterGroup.rotation.x = -0.08;
    letterGroup.userData = { baseX: x, baseY: y, baseRotationY: rotationY, material: matteMaterial };
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
        p.material.uniforms.uMouseX.value = mouse.x;
        p.material.uniforms.uMouseY.value = mouse.y;
      }
    });

    renderer.render(scene, camera);
  }

  resize();
  animate();
}
