import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

/* =========================================================
   HERO THREE.JS (2안: Blueprint Wireframe Glass X + Solid Glass U)
========================================================= */

export function initHero3D() {
  const container = document.getElementById("hero-3d");
  if (!container) return;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 15);

  const ambientLight = new THREE.AmbientLight(0xffffff, 3.0);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 5.0);
  mainLight.position.set(-4, 8, 12);
  scene.add(mainLight);

  const mouseLight = new THREE.PointLight(0xffffff, 8.0, 35);
  scene.add(mouseLight);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  container.appendChild(renderer.domElement);

  /* =====================================================
     BACKGROUND SKY LIGHT
  ===================================================== */
  const lightRayGeo = new THREE.PlaneGeometry(36, 24);
  const lightRayMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uBgSky: { value: new THREE.Color(0xb2d8f7) },
      uBgWarm: { value: new THREE.Color(0xfbf6ee) },
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
      uniform vec3 uBgSky;
      uniform vec3 uBgWarm;
      varying vec2 vUv;

      void main() {
        vec2 st = vUv;
        float grad = (st.x * 0.4 + st.y * 0.6) + (uMouse.x * 0.08 - uMouse.y * 0.08);
        grad = smoothstep(-0.2, 1.2, grad);

        vec2 lightPos = vec2(0.3, 0.7) + uMouse * 0.1;
        float lightSpot = 1.0 - smoothstep(0.0, 1.2, length(st - lightPos));

        vec3 baseBg = mix(uBgSky, uBgWarm, grad);
        vec3 finalBg = mix(baseBg, vec3(1.0), lightSpot * 0.25);

        gl_FragColor = vec4(finalBg, 1.0);
      }
    `,
    depthWrite: false,
  });

  const bgMesh = new THREE.Mesh(lightRayGeo, lightRayMat);
  bgMesh.position.set(0, 0, -8);
  scene.add(bgMesh);

  const group = new THREE.Group();
  scene.add(group);

  /* =====================================================
     GRID
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

  const gridGroup = new THREE.Group();
  gridGroup.position.set(0, 0, -3);

  const gridWidth = 36, gridHeight = 22, stepX = 2.4, stepY = 2.4, curveFactor = 0.01;
  const curvedGridGeo = createConcaveGridGeometry(gridWidth, gridHeight, stepX, stepY, curveFactor);

  const gridMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.4,
  });

  gridGroup.add(new THREE.LineSegments(curvedGridGeo, gridMaterial));

  const nodeGeo = new THREE.BoxGeometry(0.035, 0.035, 0.035);
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
     MATERIALS (U 전용 매끈한 유리 & X 전용 와이어프레임 유리)
  ===================================================== */
  // 공통 베이스 3D 글래스 셰이더
  const cleanGlassMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uMouse: { value: new THREE.Vector2(0, 0) },
      topColor: { value: new THREE.Color(0xffffff) },
      bottomColor: { value: new THREE.Color(0xe2e8f0) },
      edgeColor: { value: new THREE.Color(0xffffff) },
      opacity: { value: 0.45 },
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
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform vec3 edgeColor;
      uniform float opacity;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        vec3 lightDir = normalize(vec3(uMouse.x * 2.0 - 0.5, uMouse.y * 2.0 + 0.8, 1.5));
        float NdotL = max(dot(normal, lightDir), 0.0);

        float heightRatio = clamp((vWorldPosition.y + 2.0) / 4.0, 0.0, 1.0);
        vec3 baseGradient = mix(bottomColor, topColor, heightRatio);

        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.0);
        
        vec3 shadedColor = baseGradient * (0.8 + 0.3 * NdotL);
        vec3 finalColor = mix(shadedColor, edgeColor, fresnel * 0.9);

        float alpha = mix(opacity, 0.82, fresnel);

        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: true,
    side: THREE.FrontSide
  });

  // ★ X 내부 와이어프레임 라인 재질 (슬레이트 톤으로 또렷함 확보)
  const xWireframeLineMat = new THREE.LineBasicMaterial({
    color: 0x334155,
    transparent: true,
    opacity: 0.75,
  });

  const xWireframePointMat = new THREE.PointsMaterial({
    color: 0x0f172a,
    size: 0.06,
    transparent: true,
    opacity: 0.85,
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
     CREATE 3D LETTER (2안: U는 솔리드 유기체 글래스, X는 와이어프레임 글래스)
  ===================================================== */
  function createLetter(character, font, x, y, rotationY, scale, phase) {
    const isU = character === "U";
    
    // U: 부드럽고 둥근 3D 베벨
    // X: 명확한 다면체 입체 구조
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
          depth: 0.65,
          curveSegments: 2,
          bevelEnabled: true,
          bevelThickness: 0.1,
          bevelSize: 0.08,
          bevelOffset: 0,
          bevelSegments: 3,
        };

    const geometry = new TextGeometry(character, geometryOptions);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    geometry.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, 0);

    const letterGroup = new THREE.Group();

    if (isU) {
      // U: 완전한 매끈한 3D 유리
      letterGroup.add(new THREE.Mesh(geometry, cleanGlassMaterial));
    } else {
      // ★ X (2안 핵심): 반투명 3D 유리 Mesh + 내부 와이어프레임/노드 듀얼 레이어
      const glassMesh = new THREE.Mesh(geometry, cleanGlassMaterial);
      letterGroup.add(glassMesh);

      const edges = new THREE.EdgesGeometry(geometry, 15);
      const wireframeLines = new THREE.LineSegments(edges, xWireframeLineMat);
      letterGroup.add(wireframeLines);

      const nodePoints = new THREE.Points(geometry, xWireframePointMat);
      letterGroup.add(nodePoints);
    }

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

    mouse.x += (target.x - mouse.x) * 0.05;
    mouse.y += (target.y - mouse.y) * 0.05;

    lightRayMat.uniforms.uTime.value = time;
    lightRayMat.uniforms.uMouse.value.set(mouse.x, mouse.y);
    cleanGlassMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);

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
