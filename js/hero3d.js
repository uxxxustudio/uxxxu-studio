import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

/* =========================================================
   HERO THREE.JS (Heavy Wireframe + Side-Only Sequential Sweep Glow)
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
    transparent: true,
    opacity: 0.9,
  });

  /* =====================================================
     FONT LOADER & 옆면(Side) 전용 순차적 컬러 훑기 셰이더 설정
  ===================================================== */
  const loader = new FontLoader();

  loader.load(
    "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/fonts/helvetiker_bold.typeface.json",
    (font) => {
      // 파라미터: 문자, 폰트, x, y, 회전Y, 스케일, 순차 지연 시간(delay)
      createSideSweepLetter("U", font, -2.9, -0.65, -0.42, 0.92, 0.0);
      createSideSweepLetter("X", font, 2.25, 0.55, 0.42, 0.88, 1.8);
      createSideSweepLetter("X", font, -2.3, 3.8, 0.35, 0.52, 3.6);
      createSideSweepLetter("X", font, 5.3, -3.2, 0.45, 0.55, 5.4);
    }
  );

  function createSideSweepLetter(character, font, x, y, rotationY, scale, timeOffset) {
    const isU = character === "U";
    
    const geomOpts = isU
      ? { font: font, size: 4.1, depth: 0.38, curveSegments: 24, bevelEnabled: false }
      : { font: font, size: 4.1, depth: 0.38, curveSegments: 6, bevelEnabled: false };

    const geometry = new TextGeometry(character, geomOpts);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    geometry.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, 0);

    const letterGroup = new THREE.Group();

    // ★ 앞/뒷면은 완전히 비우고, 묵직한 두께를 가진 옆면(z축 방향 노멀)에만 컬러 빛이 순차적으로 훑는 셰이더
    const sideSweepMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMouseX: { value: 0 },
        uMouseY: { value: 0 },
        uOffset: { value: timeOffset },
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
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          // 앞면(Z > 0.1)과 뒷면(Z < -0.1)은 완전히 투명하게 비워둠 (오직 옆면만 채우기 위함)
          float isSide = 1.0 - abs(vNormal.z);
          if (isSide < 0.5) {
            discard; 
          }

          // 순차적으로 빛이 들어오고 나가는 타이밍 제어
          float cycle = sin(uTime * 0.6 + uOffset);
          float sweepIntensity = smoothstep(-0.1, 0.9, cycle);

          // 옆면을 따라 사선으로 부드럽게 지나가는 컬러 훑기 효과
          float wave = sin((vPosition.x * 0.4 + vPosition.y * 0.4) - uTime * 1.5);
          float glowBand = smoothstep(0.2, 1.0, wave) * sweepIntensity;

          // 무게감 있는 다크 그라파이트 베이스에 고급스러운 그린 컬러 빛 스침 믹스
          vec3 baseColor = vec3(0.12, 0.14, 0.16);
          vec3 sweepColor = vec3(0.15, 0.78, 0.42);

          vec3 finalColor = mix(baseColor, sweepColor, glowBand * 0.85);

          // 자연스럽고 은은한 투명도 부여
          float alpha = 0.35 + glowBand * 0.55;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const fillMesh = new THREE.Mesh(geometry, sideSweepMaterial);
    letterGroup.add(fillMesh);

    // 묵직하고 선명한 블랙 외곽선 와이어프레임
    const edges = new THREE.EdgesGeometry(geometry, isU ? 25 : 15);
    const lineSegments = new THREE.LineSegments(edges, lineMat);
    letterGroup.add(lineSegments);

    letterGroup.position.set(x, y, 0);
    letterGroup.scale.setScalar(scale);
    letterGroup.rotation.y = rotationY;
    letterGroup.rotation.x = -0.08;
    letterGroup.userData = { baseX: x, baseY: y, baseRotationY: rotationY, material: sideSweepMaterial };
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
