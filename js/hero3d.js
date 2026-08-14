import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

/* =========================================================
   HERO THREE.JS (Colorful Dreamy Glass & Mouse Light Rays)
========================================================= */

export function initHero3D() {
  const container = document.getElementById("hero-3d");
  if (!container) return;

  /* =====================================================
     SCENE & CAMERA
  ===================================================== */
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 15);

  /* =====================================================
     LIGHTS
  ===================================================== */
  const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
  scene.add(ambientLight);

  // 마우스를 따라다닐 배경 하이라이트 조명
  const mouseLight = new THREE.PointLight(0xfff7ed, 12.0, 30);
  scene.add(mouseLight);

  const dirLight = new THREE.DirectionalLight(0xe0f2fe, 4.0);
  dirLight.position.set(-5, 10, 8);
  scene.add(dirLight);

  /* =====================================================
     RENDERER
  ===================================================== */
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  container.appendChild(renderer.domElement);

  /* =====================================================
     DREAMY LIGHT BEAMS BACKGROUND (★ 마우스 반응 빛줄기)
  ===================================================== */
  const lightRayGeo = new THREE.PlaneGeometry(30, 30);
  const lightRayMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uBgColor: { value: new THREE.Color(0xbbe2f9) }, // 스카이블루 베이스
      uRayColor: { value: new THREE.Color(0xfffdfa) }, // 부드러운 햇빛/크림색
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec2 uMouse;
      uniform vec3 uBgColor;
      uniform vec3 uRayColor;
      varying vec2 vUv;

      void main() {
        vec2 st = vUv;
        
        // 마우스 오프셋을 통한 조명 각도 왜곡
        vec2 lightCenter = vec2(0.3, 0.8) + uMouse * 0.15;
        vec2 dir = st - lightCenter;
        
        // 사선 빛줄기 쉐이프 계산
        float angle = atan(dir.y, dir.x);
        float ray = sin(angle * 7.0 + uTime * 0.2) * 0.5 + 0.5;
        ray *= smoothstep(1.5, 0.0, length(dir));

        vec3 finalBg = mix(uBgColor, uRayColor, ray * 0.35);
        gl_FragColor = vec4(finalBg, 1.0);
      }
    `,
    depthWrite: false,
  });

  const bgMesh = new THREE.Mesh(lightRayGeo, lightRayMat);
  bgMesh.position.set(0, 0, -8);
  scene.add(bgMesh);

  /* =====================================================
     GRAPHIC GROUP
  ===================================================== */
  const group = new THREE.Group();
  scene.add(group);

  /* =====================================================
     CONCAVE CURVED GRID GENERATOR
  ===================================================== */
  function createConcaveGridGeometry(width, height, stepX, stepY, curveAmount = 0.01) {
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

  /* =====================================================
     BACKGROUND SPATIAL GRID (White Soft Grid)
  ===================================================== */
  const gridGroup = new THREE.Group();
  gridGroup.position.set(0, 0, -3);

  const gridWidth = 36, gridHeight = 22, stepX = 2.4, stepY = 2.4, curveFactor = 0.01;
  const curvedGridGeo = createConcaveGridGeometry(gridWidth, gridHeight, stepX, stepY, curveFactor);

  const gridMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.35,
  });

  gridGroup.add(new THREE.LineSegments(curvedGridGeo, gridMaterial));

  // + 모양 노드 스팟
  const nodeGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 });

  for (let x = -gridWidth / 2; x <= gridWidth / 2; x += stepX * 2) {
    for (let y = -gridHeight / 2; y <= gridHeight / 2; y += stepY * 2) {
      if (y > -8) {
        const z = (x * x * 0.8 + y * y) * curveFactor - 3.0;
        const node = new THREE.Mesh(nodeGeo, nodeMat);
        node.position.set(x, y, z);
        gridGroup.add(node);
      }
    }
  }
  scene.add(gridGroup);

  /* =====================================================
     COLORFUL OPAL GLASS SHADER FOR U (오팔 굴절 3D)
  ===================================================== */
  const opalGlassMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uMouse: { value: new THREE.Vector2(0, 0) },
      baseColor: { value: new THREE.Color(0x38bdf8) }, // 코발트 스카이
      rimColor: { value: new THREE.Color(0xffffff) },  // 퓨어 엣지
      opacity: { value: 0.72 },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec2 uMouse;
      uniform vec3 baseColor;
      uniform vec3 rimColor;
      uniform float opacity;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        // 마우스 빛 위치에 따른 실시간 라이팅
        vec3 lightDir = normalize(vec3(uMouse.x * 3.0 - 1.0, uMouse.y * 2.0 + 1.0, 2.0));
        float NdotL = max(dot(normal, lightDir), 0.0);

        // 외곽 오팔 림라이트 (무지갯빛 굴절 효과)
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.2);
        
        vec3 colorMix = mix(baseColor, vec3(1.0), NdotL * 0.4);
        vec3 finalColor = mix(colorMix, rimColor, fresnel * 0.85);

        gl_FragColor = vec4(finalColor, opacity);
      }
    `,
    transparent: true,
    depthWrite: true,
    side: THREE.FrontSide
  });

  // X 와이어프레임 (화이트 계열로 산뜻하게)
  const xLineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.5,
  });

  /* =====================================================
     FONT LOADER & BATCH CREATION
  ===================================================== */
  const loader = new FontLoader();

  loader.load(
    "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/fonts/helvetiker_bold.typeface.json",
    (font) => {
      createLetter("U", font, -2.9, -0.65, -0.42, 0.92, 0);
      createLetter("X", font, 2.25, 0.55, 0.42, 0.88, 1.7);
      createLetter("X", font, -2.3, 3.8, 0.35, 0.52, 0.8);
      createLetter("X", font, 5.3, -3.2, 0.45, 0.55, 2.3);
    }
  );

  /* =====================================================
     CREATE 3D LETTER
  ===================================================== */
  function createLetter(character, font, x, y, rotationY, scale, phase) {
    const isU = character === "U";
    const geometryOptions = isU
      ? {
          font: font,
          size: 4.1,
          depth: 0.45,
          curveSegments: 32,
          bevelEnabled: true,
          bevelThickness: 0.42,
          bevelSize: 0.3,
          bevelOffset: 0,
          bevelSegments: 16,
        }
      : {
          font: font,
          size: 4.1,
          depth: 0.72,
          curveSegments: 1,
          bevelEnabled: false,
        };

    const geometry = new TextGeometry(character, geometryOptions);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    geometry.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, 0);

    const letterGroup = new THREE.Group();

    if (isU) {
      letterGroup.add(new THREE.Mesh(geometry, opalGlassMaterial));
    } else {
      const edges = new THREE.EdgesGeometry(geometry, 25);
      letterGroup.add(new THREE.LineSegments(edges, xLineMaterial));
    }

    letterGroup.position.set(x, y, 0);
    letterGroup.scale.setScalar(scale);
    letterGroup.rotation.y = rotationY;
    letterGroup.rotation.x = -0.08;
    letterGroup.userData = { baseX: x, baseY: y, baseRotationY: rotationY, phase: phase };
    group.add(letterGroup);
  }

  /* =====================================================
     MOUSE & INTERACTION
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

  /* =====================================================
     RESIZE & RESPONSIVE SCALE
  ===================================================== */
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

  /* =====================================================
     ANIMATION LOOP
  ===================================================== */
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();

    mouse.x += (target.x - mouse.x) * 0.05;
    mouse.y += (target.y - mouse.y) * 0.05;

    // 배경 라이트 및 쉐이더 유니폼 업데이트
    lightRayMat.uniforms.uTime.value = time;
    lightRayMat.uniforms.uMouse.value.set(mouse.x, mouse.y);
    opalGlassMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);

    mouseLight.position.set(mouse.x * 12, mouse.y * 8, 6);

    gridGroup.position.x = -mouse.x * 0.3;
    gridGroup.position.y = -mouse.y * 0.2;

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
