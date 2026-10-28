import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

/* =========================================================
   HERO THREE.JS (Scroll-reactive U & X Parallax Effect)
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
    alpha: true,
    powerPreference: "high-performance",
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  container.appendChild(renderer.domElement);

  const group = new THREE.Group();
  scene.add(group);

  /* =====================================================
      1. 배경 공간 그리드 — 구(sphere) 안쪽 버전
      카메라를 구의 뒤쪽에 두고 앞쪽 내벽을 바라보는 구조.
      → 먼 벽은 칸이 작고, 옆 벽은 크고 가깝게 보여 공간감이 생김
      아래 값만 조절하면 됩니다.
  ==================================================== */
  const SPHERE = {
    mode: "fisheye",     // "fisheye" = 카카오식(구 중심 + 어안렌즈) / "bowl" = 이전 테스트(그릇형)
    fov: 130,            // [fisheye] 가로 화각(도). 클수록 많이 휘고 칸이 작아짐
    fisheyeEdge: 0.4,    // [fisheye] 가장자리 진하기(중앙 대비). 1이면 흐림 없음
    radius: 16,          // 구 크기
    cameraBack: 0.55,    // 카메라가 구 중심에서 뒤로 물러난 정도(0=중심, 1=벽). 클수록 원근 강해짐
    meridians: 36,       // 세로선(경선) 개수 — 360°를 나눈 수. 적을수록 칸이 큼
    parallelStep: 10,    // 가로선(위선) 간격(도). 클수록 칸이 큼
    tiltX: 0.22,         // 구를 앞으로 기울이는 각도(라디안). 위쪽 선이 모이는 느낌
    color: 0xB8B8B8,     // 선 색
    opacity: 0.45,       // 중앙부 선 진하기
    edgeFade: 0.15,      // 가장자리 진하기(중앙 대비 비율). 0이면 완전히 사라짐
    scrollRotate: 0.00035, // 스크롤에 따른 회전량
    mouseRotate: 0.05,   // 마우스에 따른 회전량
    bottomFade: 0,       // (하단 페이드는 test-sphere.html의 CSS mask로 처리 중) 그리드만 따로 페이드하려면 0.35 등
  };

  function createSphereGridGeometry(r, meridians, parallelStep) {
    const pts = [];
    const seg = 160;
    // 경선 (위아래 극점으로 모이는 선)
    for (let m = 0; m < meridians; m++) {
      const lon = (m / meridians) * Math.PI * 2;
      for (let i = 0; i < seg; i++) {
        const a1 = (i / seg) * Math.PI, a2 = ((i + 1) / seg) * Math.PI;
        pts.push(
          r * Math.sin(a1) * Math.sin(lon), r * Math.cos(a1), r * Math.sin(a1) * Math.cos(lon),
          r * Math.sin(a2) * Math.sin(lon), r * Math.cos(a2), r * Math.sin(a2) * Math.cos(lon)
        );
      }
    }
    // 위선 (수평 원)
    for (let lat = -90 + parallelStep; lat < 90; lat += parallelStep) {
      const phi = THREE.MathUtils.degToRad(lat);
      const y = r * Math.sin(phi), rr = r * Math.cos(phi);
      for (let i = 0; i < seg; i++) {
        const t1 = (i / seg) * Math.PI * 2, t2 = ((i + 1) / seg) * Math.PI * 2;
        pts.push(rr * Math.sin(t1), y, rr * Math.cos(t1), rr * Math.sin(t2), y, rr * Math.cos(t2));
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }

  // 시선 중심은 진하고 가장자리로 갈수록 흐려지는 선 재질
  const gridMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(SPHERE.color) },
      uOpacity: { value: SPHERE.opacity },
      uEdge: { value: SPHERE.mode === "fisheye" ? SPHERE.fisheyeEdge : SPHERE.edgeFade },
      uFisheye: { value: SPHERE.mode === "fisheye" ? 1.0 : 0.0 },
      uHalfFov: { value: THREE.MathUtils.degToRad(SPHERE.fov / 2) },
      uAspect: { value: 1.0 },
      uBottomFade: { value: SPHERE.bottomFade },
    },
    vertexShader: `
      uniform float uFisheye;
      uniform float uHalfFov;
      uniform float uAspect;
      varying float vFocus;
      varying float vVisible;
      varying float vScreenY;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 dir = normalize(mv.xyz);
        vVisible = 1.0;
        if (uFisheye > 0.5) {
          // 어안렌즈(등거리) 투영: 시선 중심에서의 각도에 비례해 화면 위치 결정
          float theta = acos(clamp(-dir.z, -1.0, 1.0));
          float r = theta / uHalfFov;
          vec2 d = length(dir.xy) > 1e-5 ? normalize(dir.xy) : vec2(0.0);
          // 화각(fov)은 화면의 긴 쪽 기준 → 세로 화면(모바일)에서도 극점이 보이지 않음
          vec2 sc = uAspect >= 1.0 ? vec2(1.0, uAspect) : vec2(1.0 / uAspect, 1.0);
          gl_Position = vec4(d.x * r * sc.x, d.y * r * sc.y, 0.999, 1.0);
          vFocus = 1.0 - smoothstep(0.35, 1.15, r);
          vVisible = step(theta, 2.5); // 카메라 뒤쪽 선은 숨김
        } else {
          // 카메라 정면(0,0,-1)과 이루는 각 — 1에 가까울수록 화면 중앙
          vFocus = smoothstep(0.80, 0.99, dot(dir, vec3(0.0, 0.0, -1.0)));
          gl_Position = projectionMatrix * mv;
        }
        vScreenY = gl_Position.y / gl_Position.w * 0.5 + 0.5; // 0=화면 아래, 1=위
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uEdge;
      uniform float uBottomFade;
      varying float vFocus;
      varying float vVisible;
      varying float vScreenY;
      void main() {
        if (vVisible < 0.5) discard;
        float a = uOpacity * mix(uEdge, 1.0, vFocus);
        a *= smoothstep(0.0, max(uBottomFade, 0.001), vScreenY); // 아래로 갈수록 자연스럽게 사라짐
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });

  const gridGroup = new THREE.Group();
  const gridLines = new THREE.LineSegments(
    createSphereGridGeometry(SPHERE.radius, SPHERE.meridians, SPHERE.parallelStep),
    gridMaterial
  );
  gridLines.renderOrder = -1;
  gridGroup.add(gridLines);
  // 구 중심을 카메라(z=15) 앞쪽에 두어, 카메라가 구 뒤쪽 안에 있도록 배치
  const isFisheye = SPHERE.mode === "fisheye";
  const gridTilt = isFisheye ? 0 : SPHERE.tiltX;
  gridGroup.position.set(0, 0, isFisheye ? 15 : 15 - SPHERE.radius * SPHERE.cameraBack);
  gridGroup.rotation.x = gridTilt;
  scene.add(gridGroup);

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x111111,
    transparent: false,
    opacity: 1.0,
  });

  const loader = new FontLoader();

  loader.load(
    "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/fonts/helvetiker_bold.typeface.json",
    (font) => {
      createLetterMesh("U", font, -2.9, -0.65, -0.42, 0.92, 0.0, true, 0.002);
      createLetterMesh("X", font, 2.25, 0.55, 0.42, 0.88, 1.8, false, 0.003);
      createLetterMesh("X", font, -2.3, 3.8, 0.35, 0.52, 3.6, false, 0.001);
      createLetterMesh("X", font, 5.3, -3.2, 0.45, 0.55, 5.4, false, 0.004);
      createLetterMesh("U", font, 6.2, 1.8, -0.75, 0.48, 7.2, true, 0.0035);
    }
  );

  function createLetterMesh(character, font, x, y, rotationY, scale, timeOffset, isU, scrollSpeed) {
    const geomOpts = { font: font, size: 4.1, depth: 0.38, curveSegments: isU ? 24 : 6, bevelEnabled: false };

    const geometry = new TextGeometry(character, geomOpts);
    geometry.computeBoundingBox();
    const box = geometry.boundingBox;
    geometry.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, 0);

    const letterGroup = new THREE.Group();
    letterGroup.position.x = -1.5;

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uOffset: { value: timeOffset },
        uIsU: { value: isU ? 1.0 : 0.0 },
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
        uniform float uIsU;
        varying vec3 vPosition;
        varying vec3 vNormal;

        void main() {
          if (abs(vNormal.z) > 0.1) { discard; }
          float beam = 0.0;
          if (uIsU > 0.5) {
            float sideDir = (vPosition.x < 0.0) ? 1.0 : -1.0;
            float flow = mod((vPosition.y * 0.2) + (uTime * 0.3 * sideDir) + (uOffset * 0.2), 1.0);
            beam = smoothstep(0.12, 0.0, abs(flow - 0.5));
          } else {
            float angle = atan(vPosition.y, vPosition.x);
            float sweep = mod((angle / 6.28318) - (uTime * 0.15) + (uOffset * 0.1), 1.0);
            beam = smoothstep(0.12, 0.0, abs(sweep - 0.5));
          }
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

    const edges = new THREE.EdgesGeometry(geometry, isU ? 25 : 15);
    const lineSegments = new THREE.LineSegments(edges, lineMat);
    letterGroup.add(lineSegments);

    letterGroup.position.set(x, y, 0);
    letterGroup.scale.setScalar(scale);
    letterGroup.rotation.y = rotationY;
    letterGroup.rotation.x = -0.08;
    
    letterGroup.userData = { 
      baseX: x, 
      baseY: y, 
      baseRotationY: rotationY, 
      material: material,
      scrollSpeed: scrollSpeed 
    };
    
    group.add(letterGroup);
  }

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
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isMobile = window.innerWidth < 768;
    camera.aspect = width / height;
    gridMaterial.uniforms.uAspect.value = width / height;
    camera.position.z = isMobile ? 18.5 : 15;
    camera.updateProjectionMatrix();

    group.scale.setScalar(isMobile ? 0.68 : 1.0);
    renderer.setSize(width, height);
  }

  window.addEventListener("resize", resize);

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();
    const scrollY = window.scrollY || window.pageYOffset;

    mouse.x += (target.x - mouse.x) * 0.08;
    mouse.y += (target.y - mouse.y) * 0.08;

    // 그리드는 평행이동 대신 천천히 회전 → 감싸는 벽 느낌
    gridGroup.rotation.y = mouse.x * SPHERE.mouseRotate + scrollY * SPHERE.scrollRotate;
    gridGroup.rotation.x = gridTilt - mouse.y * SPHERE.mouseRotate * 0.6;
    if (isFisheye) gridGroup.position.z = camera.position.z; // 구 중심 = 카메라 위치

    group.children.forEach((obj, index) => {
      const p = obj.userData;
      const scrollOffset = scrollY * p.scrollSpeed;

      obj.position.x = p.baseX + Math.sin(time * 0.4 + index) * 0.06;
      obj.position.y = (p.baseY - scrollOffset) + Math.cos(time * 0.5 + index) * 0.08;
      
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


/* =========================================================
   EXPERIENCE SECTION OBJECT (initSectionObject) - Responsive Fixed
========================================================= */

export function initSectionObject(containerId, assetInput = "U") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const width = container.clientWidth || 300;
  const height = container.clientHeight || 300;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
  camera.position.set(0, 0, 18);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x111111,
    transparent: false,
    opacity: 1.0,
  });

  // [중요] 모바일 대응 및 반응형 Resize 처리 함수 정의
  function handleResize() {
    if (!container) return;
    const w = container.clientWidth || 300;
    const h = container.clientHeight || 300;
    
    // 모바일(768px 이하)일 때 3D 오브젝트 크기 비율 보정
    const isMobile = window.innerWidth <= 768;
    camera.aspect = w / h;
    camera.position.z = isMobile ? 22 : 18; // 모바일에서 잘리지 않도록 멀리 배치
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
  }

  // 리사이즈 및 로드 이벤트 등록
  window.addEventListener("resize", handleResize);
  window.addEventListener("orientationchange", handleResize);

  if (assetInput.length <= 2 && !assetInput.includes(".")) {
    const loader = new FontLoader();
    loader.load(
      "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/fonts/helvetiker_bold.typeface.json",
      (font) => {
        const geomOpts = { font: font, size: 7.2, depth: 1.2, curveSegments: 24, bevelEnabled: false };
        const geometry = new TextGeometry(assetInput, geomOpts);
        geometry.computeBoundingBox();
        const box = geometry.boundingBox;
        geometry.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, 0);

        const characterGroup = new THREE.Group();

        const material = new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uOffset: { value: 1.0 },
            uIsU: { value: 1.0 },
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
            uniform float uIsU;
            varying vec3 vPosition;
            varying vec3 vNormal;

            void main() {
              if (abs(vNormal.z) > 0.1) { discard; }
              float sideDir = (vPosition.x < 0.0) ? 1.0 : -1.0;
              float flow = mod((vPosition.y * 0.2) + (uTime * 0.3 * sideDir) + (uOffset * 0.2), 1.0);
              float beam = smoothstep(0.12, 0.0, abs(flow - 0.5));

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
        characterGroup.add(fillMesh);

        const edges = new THREE.EdgesGeometry(geometry, 25);
        const lineSegments = new THREE.LineSegments(edges, lineMat);
        characterGroup.add(lineSegments);

        const wrapperGroup = new THREE.Group();
        wrapperGroup.add(characterGroup);
        scene.add(wrapperGroup);

        const clock = new THREE.Clock();

        function animate() {
          requestAnimationFrame(animate);
          const time = clock.getElapsedTime();
          const scrollY = window.scrollY || window.pageYOffset;

          const basePosY = -1.0; 
          const scrollOffset = scrollY * 0.0015;

          wrapperGroup.position.x = 0;
          wrapperGroup.position.y = basePosY + scrollOffset + Math.sin(time * 0.4) * 0.12;
          wrapperGroup.rotation.y += 0.005;

          wrapperGroup.traverse((child) => {
            if (child.material && child.material.uniforms && child.material.uniforms.uTime) {
              child.material.uniforms.uTime.value = time;
            }
          });

          renderer.render(scene, camera);
        }
        
        handleResize(); // 최초 생성 후 크기 보정 호출
        animate();
      }
    );
  } else {
    const svgLoader = new SVGLoader();
    svgLoader.load(
      assetInput,
      (data) => {
        const paths = data.paths;
        const characterGroup = new THREE.Group();

        paths.forEach((path) => {
          const shapes = SVGLoader.createShapes(path);
          shapes.forEach((shape) => {
            const extrudeSettings = { depth: 1.2, bevelEnabled: false };
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

            const material = new THREE.ShaderMaterial({
              uniforms: {
                uTime: { value: 0 },
                uOffset: { value: 1.0 },
                uIsU: { value: 1.0 },
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
                uniform float uIsU;
                varying vec3 vPosition;
                varying vec3 vNormal;

                void main() {
                  if (abs(vNormal.z) > 0.1) { discard; }
                  float sideDir = (vPosition.x < 0.0) ? 1.0 : -1.0;
                  float flow = mod((vPosition.y * 0.2) + (uTime * 0.3 * sideDir) + (uOffset * 0.2), 1.0);
                  float beam = smoothstep(0.12, 0.0, abs(flow - 0.5));

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
            characterGroup.add(fillMesh);

            const edges = new THREE.EdgesGeometry(geometry, 20);
            const lineSegments = new THREE.LineSegments(edges, lineMat);
            characterGroup.add(lineSegments);
          });
        });

        characterGroup.scale.y = -1;
        const box = new THREE.Box3().setFromObject(characterGroup);
        const center = box.getCenter(new THREE.Vector3());
        characterGroup.position.x = -center.x;
        characterGroup.position.y = -center.y;

        const wrapperGroup = new THREE.Group();
        wrapperGroup.add(characterGroup);
        wrapperGroup.scale.setScalar(0.08);
        scene.add(wrapperGroup);

        const clock = new THREE.Clock();

        function animate() {
          requestAnimationFrame(animate);
          const time = clock.getElapsedTime();
          const scrollY = window.scrollY || window.pageYOffset;

          wrapperGroup.position.y = -1.0 + (scrollY * 0.0015) + Math.sin(time * 0.4) * 0.12;
          wrapperGroup.rotation.y += 0.005;

          wrapperGroup.traverse((child) => {
            if (child.material && child.material.uniforms && child.material.uniforms.uTime) {
              child.material.uniforms.uTime.value = time;
            }
          });

          renderer.render(scene, camera);
        }

        handleResize(); // 최초 생성 후 크기 보정 호출
        animate();
      }
    );
  }
}

/* =========================================================
   PORTFOLIO SECTION 3D OBJECT (initPortfolio3D) - "W" (모션 및 잘림 수정 버전)
========================================================= */
export function initPortfolio3D(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const width = container.clientWidth || 400;
  const height = container.clientHeight || 400;

  const scene = new THREE.Scene();
  // 카메라 거리를 18 -> 22로 멀게 해서 윗부분이 잘리지 않도록 여유를 줌
  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
  camera.position.set(0, 0, 22);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x111111,
    transparent: false,
    opacity: 1.0,
  });

  const loader = new FontLoader();
  loader.load(
    "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/fonts/helvetiker_bold.typeface.json",
    (font) => {
      const geomOpts = { font: font, size: 7.2, depth: 1.2, curveSegments: 24, bevelEnabled: false };
      const geometry = new TextGeometry("W", geomOpts);
      geometry.computeBoundingBox();
      const box = geometry.boundingBox;
      geometry.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, 0);

      const characterGroup = new THREE.Group();

      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uOffset: { value: 1.5 },
          uIsU: { value: 1.0 },
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
          uniform float uIsU;
          varying vec3 vPosition;
          varying vec3 vNormal;

          void main() {
            if (abs(vNormal.z) > 0.1) { discard; }
            float sideDir = (vPosition.x < 0.0) ? 1.0 : -1.0;
            float flow = mod((vPosition.y * 0.2) + (uTime * 0.3 * sideDir) + (uOffset * 0.2), 1.0);
            float beam = smoothstep(0.12, 0.0, abs(flow - 0.5));

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
      characterGroup.add(fillMesh);

      const edges = new THREE.EdgesGeometry(geometry, 25);
      const lineSegments = new THREE.LineSegments(edges, lineMat);
      characterGroup.add(lineSegments);

      const wrapperGroup = new THREE.Group();
      wrapperGroup.add(characterGroup);
      scene.add(wrapperGroup);

      // 마우스 인터랙션 좌표 변수
      let mouseX = 0;
      let mouseY = 0;
      window.addEventListener("mousemove", (e) => {
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
      });

      const clock = new THREE.Clock();

      function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();
        const scrollY = window.scrollY || window.pageYOffset;
        const scrollOffset = scrollY * 0.0010;

        // 뱅뱅 돌지 않고, 마우스 움직임과 부드러운 호흡(상하/좌우 미세한 틸트)만 주도록 변경
        const targetRotationY = mouseX * 0.3; // 마우스 방향으로 살짝개 고개 돌림
        const targetRotationX = mouseY * 0.3;

        wrapperGroup.rotation.y += (targetRotationY - wrapperGroup.rotation.y) * 0.05;
        wrapperGroup.rotation.x += (targetRotationX - wrapperGroup.rotation.x) * 0.05;

        // 위아래로 은은하게 떠있는 모션 (숨쉬듯 부드럽게)
        wrapperGroup.position.y = scrollOffset + Math.sin(time * 1.2) * 0.15;

        wrapperGroup.traverse((child) => {
          if (child.material && child.material.uniforms && child.material.uniforms.uTime) {
            child.material.uniforms.uTime.value = time;
          }
        });

        renderer.render(scene, camera);
      }
      animate();
    }
  );

  window.addEventListener("resize", () => {
    const newWidth = container.clientWidth || 400;
    const newHeight = container.clientHeight || 400;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
  });
}
/* =========================================================
   PROFILE 3D DUMMY (에러 방지용)
========================================================= */
export function initProfile3D(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (container.offsetParent === null) return; // 모바일처럼 숨겨진 화면에서는 3D를 만들지 않음

  container.innerHTML = "";

  const width = container.clientWidth || 300;
  const height = container.clientHeight || 280;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
  camera.position.set(0, 0, 22);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 동전: 메인 타이포 3D(U·X)와 같은 결의 유리 동전.
  // 옆면(두께)은 옅게 비치는 벽이고 그 위로 초록 빛이 돈다. 앞뒤 둘레에는 가는 회색 윤곽선, 앞면에는 캐릭터 선화.
  const RADIUS = 5; // 동전 반지름 (옆면·뒷면)
  const FRONT_RADIUS = RADIUS * 1.0; // 앞면 원은 살짝 작게 → 옆면을 도는 초록 빛이 앞면에 덜 가려짐
  const THICKNESS = 1.4; // 동전 두께 (지름의 약 14%)
  const BASE_YAW = -0.7; // 앞면이 왼쪽으로 꽤 돌아가 있어서 오른쪽 옆면(두께)이 보임
  const DECAL_SIZE = 8.4; // 캐릭터 이미지 한 변
  const DECAL_OFFSET_Y = -0.7; // 캐릭터 하단이 면의 아래 끝에 맞도록 내림
  const RING_COLOR = 0x8a8a8a; // 앞뒤 둘레 윤곽선 색 (타이포 3D의 윤곽선과 같은 회색)

  const wrapperGroup = new THREE.Group(); // 동전 전체 (위아래로 떠 있는 모션)
  scene.add(wrapperGroup);

  const characterGroup = new THREE.Group(); // 동전 (마우스를 따라 W처럼 살짝 기울어짐)
  characterGroup.rotation.y = BASE_YAW;
  wrapperGroup.add(characterGroup);

  const glassMaterials = [];

  const textureUrl = new URL("../assets/images/profile_character.webp", import.meta.url).href;

  new THREE.TextureLoader().load(textureUrl, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // 옆면: 타이포 3D(U·X)의 벽과 같은 재질. 평소엔 옅게 비치는 회색, 빛이 지나갈 때만 초록으로 진해진다.
    // 빛은 둘레를 따라 돌고(오른쪽 옆면에서 아래 → 위), 머리는 밝고 꼬리는 길게 사라진다.
    const sideMaterial = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vPosition;

        void main() {
          // 동전 평면에서의 각도 0~1 (반시계 방향 = 오른쪽에서 위로)
          float a = atan(-vPosition.z, vPosition.x) / 6.28318530718 + 0.5;
          float head = fract(uTime * 0.16);
          float d = fract(head - a);
          float s = d > 0.95 ? d - 1.0 : d;
          float beam = (1.0 - smoothstep(0.0, 0.32, s)) * smoothstep(-0.04, 0.0, s);

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
    glassMaterials.push(sideMaterial);

    const side = new THREE.Mesh(
      new THREE.CylinderGeometry(RADIUS, RADIUS, THICKNESS, 128, 1, true),
      sideMaterial
    );
    side.rotation.x = Math.PI / 2; // 원통 축을 Z(앞뒤)로 눕힘
    side.renderOrder = 1;
    characterGroup.add(side);

    // 앞면 / 뒷면: 거의 흰색의 옅게 비치는 면 (면 너머로 옆면과 뒷면 윤곽이 희미하게 비침)
    const plateMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    const decalMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
    // 뒷면 그림: 앞에서 보면 좌우가 뒤집힌 모습으로 앞판 너머에 아주 옅게 비침 (뒤에서 보면 똑바로 보임)
    const ghostMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const frontPlate = new THREE.Mesh(new THREE.CircleGeometry(FRONT_RADIUS, 128), plateMaterial);
    frontPlate.position.z = THICKNESS / 2;
    frontPlate.renderOrder = 2;
    characterGroup.add(frontPlate);

    const frontDecal = new THREE.Mesh(new THREE.PlaneGeometry(DECAL_SIZE, DECAL_SIZE), decalMaterial);
    frontDecal.position.set(0, DECAL_OFFSET_Y, THICKNESS / 2 + 0.02);
    frontDecal.renderOrder = 3;
    characterGroup.add(frontDecal);

    const backPlate = new THREE.Mesh(new THREE.CircleGeometry(RADIUS, 128), plateMaterial);
    backPlate.position.z = -THICKNESS / 2;
    backPlate.rotation.y = Math.PI;
    backPlate.renderOrder = 0;
    characterGroup.add(backPlate);

    const backDecal = new THREE.Mesh(new THREE.PlaneGeometry(DECAL_SIZE, DECAL_SIZE), ghostMaterial);
    backDecal.position.set(0, DECAL_OFFSET_Y, -THICKNESS / 2 - 0.02);
    backDecal.rotation.y = Math.PI;
    backDecal.renderOrder = 0;
    characterGroup.add(backDecal);

    // 윤곽선: 앞/뒤 둘레의 가는 1px 선 (타이포 3D의 윤곽선처럼)
    const ringPoints = [];
    for (let i = 0; i < 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      ringPoints.push(new THREE.Vector3(Math.cos(angle) * RADIUS, Math.sin(angle) * RADIUS, 0));
    }
    const ringGeometry = new THREE.BufferGeometry().setFromPoints(ringPoints);
    const ringMaterial = new THREE.LineBasicMaterial({ color: RING_COLOR });

    const frontRingPoints = ringPoints.map((p) => p.clone().multiplyScalar(FRONT_RADIUS / RADIUS));
    const frontRing = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(frontRingPoints), ringMaterial);
    frontRing.position.z = THICKNESS / 2 + 0.03;
    characterGroup.add(frontRing);

    // 두께 윤곽선: 뒷면 둘레는 옆면 바깥으로 드러나는 오른쪽 반원만 그리고,
    // 위·아래 끝에서 앞면 둘레와 직선(옆면의 외곽)으로 이어 하나의 테두리로 만든다.
    // (뒷면 원 전체를 그리면 앞면 원과 X자로 교차해 원 두 개가 겹친 것처럼 보임)
    const backZ = -THICKNESS / 2 - 0.03;
    const frontZ = THICKNESS / 2 + 0.03;
    const rimPoints = [new THREE.Vector3(0, -FRONT_RADIUS, frontZ)];
    for (let i = 0; i <= 64; i++) {
      const angle = -Math.PI / 2 + (i / 64) * Math.PI; // 아래(-90°) → 오른쪽 → 위(90°)
      rimPoints.push(new THREE.Vector3(Math.cos(angle) * RADIUS, Math.sin(angle) * RADIUS, backZ));
    }
    rimPoints.push(new THREE.Vector3(0, FRONT_RADIUS, frontZ));
    const backRim = new THREE.Line(new THREE.BufferGeometry().setFromPoints(rimPoints), ringMaterial);
    characterGroup.add(backRim);
  });

  // 마우스 인터랙션 좌표 (W와 동일한 방식)
  let mouseX = 0;
  let mouseY = 0;
  window.addEventListener("mousemove", (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // 화면 밖에서는 렌더링 멈춤
  let isVisible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    }).observe(container);
  }

  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    if (!isVisible) return;

    const time = clock.getElapsedTime();

    if (!reduceMotion) {
      glassMaterials.forEach((material) => { material.uniforms.uTime.value = time; });

      // 커서를 살짝 바라보는 정도 + 가만히 있어도 보이는 미세한 스웨이
      // (기본 각도 BASE_YAW 주변에서만 움직여서 옆면이 항상 같은 쪽에 보이게)
      const targetRotationY = BASE_YAW + mouseX * 0.12 + Math.sin(time * 0.7) * 0.06;
      const targetRotationX = -mouseY * 0.12 + Math.sin(time * 0.5) * 0.04;

      characterGroup.rotation.y += (targetRotationY - characterGroup.rotation.y) * 0.05;
      characterGroup.rotation.x += (targetRotationX - characterGroup.rotation.x) * 0.05;

      // 숨쉬듯 은은하게 떠 있는 모션
      wrapperGroup.position.y = Math.sin(time * 1.2) * 0.15;
    }

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    const newWidth = container.clientWidth || 300;
    const newHeight = container.clientHeight || 280;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
  });
}
// 모바일 화면 로드시 Three.js 리사이즈 이벤트 강제 호출
window.addEventListener('load', () => {
    window.dispatchEvent(new Event('resize'));
});
