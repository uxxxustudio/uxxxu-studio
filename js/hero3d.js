import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

/* =========================================================
   HERO THREE.JS (HAOQI.DESIGN Multiple Discrete Sunbeam Patches)
========================================================= */

export function initHero3D() {
  const container = document.getElementById("hero-3d");
  if (!container) return;

  container.innerHTML = "";

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 15);

  /* =====================================================
     LIGHTING
  ===================================================== */
  const ambientLight = new THREE.AmbientLight(0xffffff, 3.8);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 4.5);
  mainLight.position.set(-5, 9, 10);
  scene.add(mainLight);

  const mouseLight = new THREE.PointLight(0xffffff, 5.0, 35);
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
     ★ BACKGROUND: MULTIPLE DISCRETE LIGHT PATCHES SHADER
  ===================================================== */
  const lightRayGeo = new THREE.PlaneGeometry(120, 120);
  const lightRayMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uBgBase: { value: new THREE.Color(0xbdd8f4) },   // 산뜻하고 세련된 라이트 스카이 블루
      uSunColor: { value: new THREE.Color(0xfffeeb) }, // 따뜻한 웜 크림/파스텔 옐로우 햇살
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
      uniform vec3 uBgBase;
      uniform vec3 uSunColor;
      varying vec2 vUv;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
          mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x),
          f.y
        );
      }

      void main() {
        vec2 st = vUv;
        vec2 mouseOffset = uMouse * 0.02;
        vec2 p = st + mouseOffset;

        // 대각선 방향으로 회전 (-35도)
        float angle = -0.6;
        mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        vec2 rotP = rot * (p - vec2(0.2, 0.8));

        // 여러 크기의 빛 조각/패치를 생성하기 위한 다중 스케일 노이즈
        vec2 uv1 = vec2(rotP.x * 5.5, rotP.y * 1.6);
        vec2 uv2 = vec2(rotP.x * 10.0 + 3.5, rotP.y * 3.2 - uTime * 0.012);
        vec2 uv3 = vec2(rotP.x * 16.0 + 7.2, rotP.y * 5.0);

        float n1 = noise(uv1);
        float n2 = noise(uv2);
        float n3 = noise(uv3);

        float rawNoise = n1 * 0.52 + n2 * 0.33 + n3 * 0.15;

        // ★ 핵심: 문턱값(Threshold)을 주어 빛이 쪼개진 독립된 여러 조각으로 형성되게 변경
        float lightSpots = smoothstep(0.42, 0.72, rawNoise);

        // 좌상단에서 발산되어 중앙 하단으로 가면서 거리가 멀어지면 은은하게 감쇄
        float distFromOrigin = length(p - vec2(0.05, 0.95));
        float fade = smoothstep(1.35, 0.25, distFromOrigin);

        // 상단 코어 영역 부드러운 글로우
        float mainGlow = smoothstep(0.7, 0.0, distFromOrigin) * 0.45;

        // 최종 빛 강도
        float finalIntensity = clamp(lightSpots * fade * 1.1 + mainGlow, 0.0, 1.0);

        // 스카이블루와 따뜻한 햇빛 패치의 또렷한 합성
        vec3 finalBg = mix(uBgBase, uSunColor, finalIntensity * 0.92);

        gl_FragColor = vec4(finalBg, 1.0);
      }
    `,
    depthWrite: false,
  });

  const bgMesh = new THREE.Mesh(lightRayGeo, lightRayMat);
  bgMesh.position.set(0, 0, -10);
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
    opacity: 0.45,
  });

  gridGroup.add(new THREE.LineSegments(curvedGridGeo, gridMaterial));

  const nodeGeo = new THREE.BoxGeometry(0.035, 0.035, 0.035);
  const nodeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });

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
     U 전용: 아이스 화이트 글래스 (Frosted Ice Glass)
  ===================================================== */
  const uIceGlassMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uMouse: { value: new THREE.Vector2(0, 0) },
      topColor: { value: new THREE.Color(0xffffff) },
      bottomColor: { value: new THREE.Color(0xdceeff) },
      edgeHighlight: { value: new THREE.Color(0xffffff) },
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
      uniform vec3 edgeHighlight;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        vec3 lightDir = normalize(vec3(-0.5 + uMouse.x * 0.5, 1.2 + uMouse.y * 0.5, 1.5));
        float NdotL = max(dot(normal, lightDir), 0.0);

        vec3 halfDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);

        float heightRatio = clamp((vWorldPosition.y + 2.2) / 4.5, 0.0, 1.0);
        vec3 baseGradient = mix(bottomColor, topColor, heightRatio);

        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.2);
        
        vec3 shadedColor = baseGradient * (0.85 + 0.25 * NdotL);
        vec3 finalColor = mix(shadedColor, edgeHighlight, fresnel * 0.75) + edgeHighlight * spec * 0.75;

        gl_FragColor = vec4(finalColor, 0.92);
      }
    `,
    transparent: true,
    depthWrite: true,
    side: THREE.FrontSide
  });

  /* =====================================================
     X 전용: CAD 스타일 미니멀 와이어프레임
  ===================================================== */
  const xWireframeMat = new THREE.LineBasicMaterial({
    color: 0x64748b,
    transparent: true,
    opacity: 0.35,
  });

  /* =====================================================
     FONT LOADER
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

  function createLetter(character, font, x, y, rotationY, scale, phase) {
    const isU = character === "U";
    
    const geometryOptions = isU
      ? {
          font: font,
          size: 4.1,
          depth: 0.5,
          curveSegments: 32,
          bevelEnabled: true,
          bevelThickness: 0.45,
          bevelSize: 0.32,
          bevelOffset: 0,
          bevelSegments: 16,
        }
      : {
          font: font,
          size: 4.1,
          depth: 0.7,
          curveSegments: 1,
          bevelEnabled: false,
        };

    const geometry = new TextGeometry(character, geometryOptions);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    geometry.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, 0);

    const letterGroup = new THREE.Group();

    if (isU) {
      letterGroup.add(new THREE.Mesh(geometry, uIceGlassMaterial));
    } else {
      const edges = new THREE.EdgesGeometry(geometry, 25);
      letterGroup.add(new THREE.LineSegments(edges, xWireframeMat));
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

    mouse.x += (target.x - mouse.x) * 0.08;
    mouse.y += (target.y - mouse.y) * 0.08;

    lightRayMat.uniforms.uTime.value = time;
    lightRayMat.uniforms.uMouse.value.set(mouse.x, mouse.y);
    uIceGlassMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);

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
