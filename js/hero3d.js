import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

/* =========================================================
   HERO THREE.JS (Isolated U-Legs Mesh Separation & Clean X Sweep)
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
      // U는 좌우 기둥을 완벽히 독립된 메쉬로 생성하여 각각 단 1개의 빛이 반대로 흐르게 처리
      createUMesh(font, -2.9, -0.65, -0.42, 0.92, 0.0);
      
      // X 글자들 (기존과 동일하게 단일 레이저 스윕 유지)
      createLetterMesh("X", font, 2.25, 0.55, 0.42, 0.88, 1.8);
      createLetterMesh("X", font, -2.3, 3.8, 0.35, 0.52, 3.6);
      createLetterMesh("X", font, 5.3, -3.2, 0.45, 0.55, 5.4);
    }
  );

  /* =====================================================
     U 자 전용 생성 함수 (좌우 기둥 분리형)
  ===================================================== */
  function createUMesh(font, x, y, rotationY, scale, timeOffset) {
    const uGroup = new Date ? new THREE.Group() : new THREE.Group();

    const geomOpts = { font: font, size: 4.1, depth: 0.38, curveSegments: 24, bevelEnabled: false };
    const geometry = new TextGeometry("U", geomOpts);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    geometry.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, 0);

    // 공통 셰이더 머티리얼 생성 함수 (direction: 1.0은 위->아래, -1.0은 아래->위)
    function createPillarMaterial(flowDirection) {
      return new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uOffset: { value: timeOffset },
          uDir: { value: flowDirection },
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
          uniform float uDir;
          varying vec3 vPosition;
          varying vec3 vNormal;

          void main() {
            // Z축 앞뒤 면 제거
            if (abs(vNormal.z) > 0.05) {
              discard; 
            }

            // 세로축 기준 단 하나의 선명한 레이저 포인트 생성
            float normalizedY = (vPosition.y + 2.0) / 4.0;
            float sweep = mod(normalizedY + (uTime * 0.25 * uDir) + (uOffset * 0.1), 1.0);
            float distFromCenter = abs(sweep - 0.5);
            float beam = smoothstep(0.12, 0.0, distFromCenter);

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
    }

    // 왼쪽 기둥 (위에서 아래로 흐름: uDir = 1.0)
    const leftMat = createPillarMaterial(1.0);
    const leftMesh = new THREE.Mesh(geometry, leftMat);
    // 왼쪽 기둥만 보이도록 자르기 위해 스텐실/클리핑 대신 X 좌표로 범위 제한 (geometry clone 후 vertex 수정)
    // 혹은 간단하게 좌우 각각 메시를 두고 matrix로 배치
    
    // 가장 깔끔한 방법: 왼쪽 클론과 오른쪽 클론을 만들고 각각 셰이더에서 X좌표로 판별하여 렌더링
    const leftMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOffset: { value: timeOffset }, uDir: { value: 1.0 } },
      vertexShader: `
        varying vec3 vPosition; varying vec3 vNormal;
        void main() { vPosition = position; vNormal = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        uniform float uTime; uniform float uOffset; uniform float uDir;
        varying vec3 vPosition; varying vec3 vNormal;
        void main() {
          if (abs(vNormal.z) > 0.05 || vPosition.x > 0.1) discard; // 왼쪽 기둥만 허용
          float normalizedY = (vPosition.y + 2.0) / 4.0;
          float sweep = mod(normalizedY + (uTime * 0.25 * uDir) + (uOffset * 0.1), 1.0);
          float beam = smoothstep(0.12, 0.0, abs(sweep - 0.5));
          gl_FragColor = vec4(mix(vec3(0.04), vec3(0.12, 0.95, 0.45), beam), 0.08 + beam * 0.92);
        }
      `,
      transparent: true, side: THREE.DoubleSide, depthWrite: false
    });

    const rightMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uOffset: { value: timeOffset }, uDir: { value: -1.0 } },
      vertexShader: `
        varying vec3 vPosition; varying vec3 vNormal;
        void main() { vPosition = position; vNormal = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
      fragmentShader: `
        uniform float uTime; uniform float uOffset; uniform float uDir;
        varying vec3 vPosition; varying vec3 vNormal;
        void main() {
          if (abs(vNormal.z) > 0.05 || vPosition.x < -0.1) discard; // 오른쪽 기둥만 허용
          float normalizedY = (vPosition.y + 2.0) / 4.0;
          float sweep = mod(normalizedY + (uTime * 0.25 * uDir) + (uOffset * 0.1), 1.0);
          float beam = smoothstep(0.12, 0.0, abs(sweep - 0.5));
          gl_FragColor = vec4(mix(vec3(0.04), vec3(0.12, 0.95, 0.45), beam), 0.08 + beam * 0.92);
        }
      `,
      transparent: true, side: THREE.DoubleSide, depthWrite: false
    });

    const meshLeft = new THREE.Mesh(geometry, leftMaterial);
    const meshRight = new THREE.Mesh(geometry, rightMaterial);
    uGroup.add(meshLeft);
    uGroup.add(meshRight);

    // 테두리 외곽선
    const edges = new THREE.EdgesGeometry(geometry, 25);
    const lineSegments = new THREE.LineSegments(edges, lineMat);
    uGroup.add(lineSegments);

    uGroup.position.set(x, y, 0);
    uGroup.scale.setScalar(scale);
    uGroup.rotation.y = rotationY;
    uGroup.rotation.x = -0.08;
    uGroup.userData = { 
      baseX: x, baseY: y, baseRotationY: rotationY, 
      materials: [leftMaterial, rightMaterial] 
    };
    group.add(uGroup);
  }

  /* =====================================================
     X 글자 생성 함수
  ===================================================== */
  function createLetterMesh(character, font, x, y, rotationY, scale, timeOffset) {
    const geometry = new TextGeometry(character, {
      font: font, size: 4.1, depth: 0.38, curveSegments: 6, bevelEnabled: false
    });
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    geometry.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, 0);

    const letterGroup = new THREE.Group();

    const material = new THREE.ShaderMaterial({
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
          if (abs(vNormal.z) > 0.05) {
            discard; 
          }

          float angle = atan(vPosition.y, vPosition.x);
          float sweep = mod((angle / 6.28318) - (uTime * 0.15) + (uOffset * 0.1), 1.0);
          float distFromCenter = abs(sweep - 0.5);
          float beam = smoothstep(0.12, 0.0, distFromCenter);

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

    const edges = new THREE.EdgesGeometry(geometry, 15);
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

      // 애니메이션 시간 업데이트
      if (p.material) {
        p.material.uniforms.uTime.value = time;
      }
      if (p.materials) {
        p.materials.forEach(mat => {
          mat.uniforms.uTime.value = time;
        });
      }
    });

    renderer.render(scene, camera);
  }

  resize();
  animate();
}
