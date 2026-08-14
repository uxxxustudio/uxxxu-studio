import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

/* =========================================================
   HERO THREE.JS (Ref Match: Glossy Glass U + Sunbeam Bg)
========================================================= */

export function initHero3D() {
  const container = document.getElementById("hero-3d");
  if (!container) return;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 15);

  /* =====================================================
     LIGHTING setup
  ===================================================== */
  const ambientLight = new THREE.AmbientLight(0xdbeafe, 2.5);
  scene.add(ambientLight);

  // 상단 좌측 강한 빛 (레퍼런스 햇살 조명)
  const sunLight = new THREE.DirectionalLight(0xffffff, 6.0);
  sunLight.position.set(-6, 10, 8);
  scene.add(sunLight);

  const fillLight = new THREE.DirectionalLight(0x60a5fa, 3.0);
  fillLight.position.set(6, -6, 6);
  scene.add(fillLight);

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
     ★ BACKGROUND SKY LIGHT (강렬한 좌상단 Sunlight)
  ===================================================== */
  const lightRayGeo = new THREE.PlaneGeometry(36, 24);
  const lightRayMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uBgBase: { value: new THREE.Color(0xa3ceea) }, // 시원한 스카이 블루
      uSunColor: { value: new THREE.Color(0xfffdf5) }, // 햇살 웜화이트
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

      void main() {
        vec2 st = vUv;
        
        // 좌측 상단 강한 햇살 빔
        vec2 sunPos = vec2(-0.1, 1.1) + uMouse * 0.05;
        float dist = length(st - sunPos);
        
        // 사선 방향으로 퍼지는 햇빛 스포트라이트
        float ray = smoothstep(1.4, 0.0, dist);
        float beam = pow(ray, 1.8);

        vec3 finalBg = mix(uBgBase, uSunColor, beam * 0.75);

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
    opacity: 0.45,
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
     ★ U 전용: 레퍼런스 스타일 글로시 블루 글래스 (Glossy Glass)
  ===================================================== */
  const uGlossyGlassMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uMouse: { value: new THREE.Vector2(0, 0) },
      glassColor: { value: new THREE.Color(0x3b82f6) },  // 레퍼런스의 쨍한 블루
      highlightColor: { value: new THREE.Color(0xffffff) }, // 하이라이트 림
      innerGlow: { value: new THREE.Color(0x93c5fd) },
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
      uniform vec3 glassColor;
      uniform vec3 highlightColor;
      uniform vec3 innerGlow;

      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPosition;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        // 메인 상단 광원 Direction
        vec3 lightDir = normalize(vec3(-0.5 + uMouse.x * 0.5, 1.2 + uMouse.y * 0.5, 1.5));
        
        // 하이라이트 (Specular)
        vec3 halfDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);

        // 프레넬 림 라이트 (외곽 투명 반사)
        float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 2.2);

        // 기본 글로시 베이스
        float NdotL = max(dot(normal, lightDir), 0.0);
        vec3 base = mix(glassColor * 0.7, innerGlow, NdotL * 0.8);

        // 최종 매끈한 글래스 튜브 질감 완성
        vec3 finalColor = mix(base, highlightColor, fresnel * 0.8) + highlightColor * spec * 0.9;

        // 적절한 투명도로 배경이 살짝 비치는 반투명 느낌
        float alpha = mix(0.72, 0.95, fresnel);

        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: true,
    side: THREE.FrontSide
  });

  /* =====================================================
     ★ X 전용: 정돈된 선명한 CAD 와이어프레임
  ===================================================== */
  const xWireframeMat = new THREE.LineBasicMaterial({
    color: 0x334155,
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
          depth: 0.55,
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
      // U: 레퍼런스의 글로시 블루 글래스
      letterGroup.add(new THREE.Mesh(geometry, uGlossyGlassMaterial));
    } else {
      // X: 깔끔한 와이어프레임
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

    mouse.x += (target.x - mouse.x) * 0.05;
    mouse.y += (target.y - mouse.y) * 0.05;

    lightRayMat.uniforms.uTime.value = time;
    lightRayMat.uniforms.uMouse.value.set(mouse.x, mouse.y);
    uGlossyGlassMaterial.uniforms.uMouse.value.set(mouse.x, mouse.y);

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
