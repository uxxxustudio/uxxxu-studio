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
      1. 배경 공간 그리드 (실선)
  ==================================================== */
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
    color: 0xB8B8B8,
    transparent: true,
    opacity: 0.5,
  });

  const gridLines = new THREE.LineSegments(solidGridGeo, gridMaterial);
  gridGroup.add(gridLines);
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

    if (isMobile) {
        camera.fov = 60;
        camera.position.z = 18.5;
        group.scale.setScalar(0.58);
    } else {
        camera.fov = 35;
        camera.position.z = 15;
        group.scale.setScalar(1.0);
    }

    camera.updateProjectionMatrix();
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

    gridGroup.position.x = -mouse.x * 0.2;
    gridGroup.position.y = -mouse.y * 0.15 + (scrollY * 0.001);

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
   EXPERIENCE SECTION OBJECT (initSectionObject)
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
