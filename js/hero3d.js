import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

/* =========================================================
   HERO THREE.JS (Heavy Wireframe + Perimeter Laser Sweep)
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
     FONT LOADER & 테두리를 따라 도는 레이저 스윕 셰이더
  ===================================================== */
  const loader = new FontLoader();

  loader.load(
    "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/fonts/helvetiker_bold.typeface.json",
    (font) => {
      createPerimeterSweepLetter("U", font, -2.9, -0.65, -0.42, 0.92, 0.0);
      createPerimeterSweepLetter("X", font, 2.25, 0.55, 0.42, 0.88, 1.8);
      createPerimeterSweepLetter("X", font, -2.3, 3.8, 0.35, 0.52, 3.6);
      createPerimeterSweepLetter("X", font, 5.3, -3.2, 0.45, 0.55, 5.4);
    }
  );

  function createPerimeterSweepLetter(character, font, x, y, rotationY, scale, timeOffset) {
    const isU = character === "U";
    
    const geomOpts = isU
      ? { font: font, size: 4.1, depth: 0.38, curveSegments: 24, bevelEnabled: false }
      : { font: font, size: 4.1, depth: 0.38, curveSegments: 6, bevelEnabled: false };

    const geometry = new TextGeometry(character, geomOpts);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    geometry.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, 0);

    const letterGroup = new THREE.Group();

    // ★ 큰 덩어리 마스크를 없애고, 옆면 테두리 경로를 따라 아주 짧고 강하게 도는 빛
    const perimeterSweepMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
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
        uniform float uOffset;
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          // 앞면과 뒷면(Z축 방향)은 완전히 투명하게 날림 -> 오직 옆면(두께)만 남음
          if (abs(vNormal.z) > 0.1) {
            discard; 
          }

          // 1. 경로 추적: 오브젝트 중심(0,0)을 기준으로 한 극좌표 각도 계산 (-PI ~ PI)
          // 이 각도를 이용해 외곽선을 따라 도는 완벽한 궤적을 만듭니다.
          float angle = atan(vPosition.y, vPosition.x);

          // 2. 스피드 및 방향 설정
          float speed = 2.5; 
          float sweep = angle - (uTime * speed) + uOffset;

          // 3. 짧고 강한 빛 생성 (큰 덩어리가 아님)
          // pow 128.0을 주어 빛이 퍼지지 않고 날카로운 레이저 코어처럼 맺히게 함
          float coreLight = pow(max(0.0, cos(sweep)), 128.0);
          // 뒤따라오는 아주 짧고 은은한 잔상 꼬리
          float tailLight = pow(max(0.0, cos(sweep)), 16.0) * 0.3;
          
          float beam = coreLight + tailLight;

          // 4. 컬러 믹스 (무게감 유지를 위해 평소엔 딥 다크 톤, 빛이 올 때만 네온 그린)
          vec3 baseColor = vec3(0.04, 0.04, 0.04);
          vec3 neonGreen = vec3(0.12, 0.95, 0.45);

          vec3 finalColor = mix(baseColor, neonGreen, beam);

          // 빛이 지나가는 곳만 밝아지고, 평소엔 옆면이 살짝만 보이도록 알파 제어
          float alpha = 0.08 + beam * 0.92;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const fillMesh = new THREE.Mesh(geometry, perimeterSweepMaterial);
    letterGroup.add(fillMesh);

    // 묵직하고 선명한 블랙 외곽선 와이어프레임 유지
    const edges = new THREE.EdgesGeometry(geometry, isU ? 25 : 15);
    const lineSegments = new THREE.LineSegments(edges, lineMat);
    letterGroup.add(lineSegments);

    letterGroup.position.set(x, y, 0);
    letterGroup.scale.setScalar(scale);
    letterGroup.rotation.y = rotationY;
    letterGroup.rotation.x = -0.08;
    letterGroup.userData = { baseX: x, baseY: y, baseRotationY: rotationY, material: perimeterSweepMaterial };
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
