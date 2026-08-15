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
    color: 0xe5e7eb,
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
   PROFILE SECTION 3D OBJECT (initProfile3D) - 완전 분리 좌우 배치 및 3D 입체감 강화
========================================================= */

export function initProfile3D(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const width = container.clientWidth || 400;
  const height = container.clientHeight || 450;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
  camera.position.set(0, 0, 24);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const textureLoader = new THREE.TextureLoader();

  textureLoader.load(
    "./assets/images/ne.svg",
    (texture) => {
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      const imageAspect = texture.image ? (texture.image.width / texture.image.height) : 1;
      const baseHeight = 3.5;
      const baseWidth = baseHeight * (isNaN(imageAspect) ? 1 : imageAspect);

      // 입체적인 굴곡(3D 웨이브)을 주기 위해 세분화(Segments)를 높임
      const geometry = new THREE.PlaneGeometry(baseWidth, baseHeight, 32, 32);

      // 3D 입체감과 빛 흐름이 느껴지는 셰이더 머티리얼
      const create3DMaterial = () => {
        return new THREE.ShaderMaterial({
          uniforms: {
            uTime: { value: 0 },
            uTexture: { value: texture },
          },
          vertexShader: `
            uniform float uTime;
            varying vec2 vUv;
            varying vec3 vPosition;
            void main() {
              vUv = uv;
              vec3 pos = position;
              // 정면에 볼록한 입체 굴곡 및 웨이브 효과 부여
              pos.z += sin(pos.x * 1.2 + uTime * 1.5) * 0.25 + cos(pos.y * 1.2 + uTime * 1.2) * 0.25;
              vPosition = pos;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `,
          fragmentShader: `
            uniform sampler2D uTexture;
            uniform float uTime;
            varying vec2 vUv;
            varying vec3 vPosition;
            void main() {
              vec4 texColor = texture2D(uTexture, vUv);
              if (texColor.a < 0.1) discard;

              // 3D 표면에 비치는 은은한 하이라이트 효과
              float highlight = smoothstep(0.0, 1.0, sin(vPosition.x + uTime * 2.0));
              vec3 finalColor = mix(texColor.rgb, texColor.rgb + vec3(0.15), highlight);

              gl_FragColor = vec4(finalColor, texColor.a);
            }
          `,
          transparent: true,
          side: THREE.DoubleSide,
        });
      };

      // 개별 메시 생성
      const leftMesh = new THREE.Mesh(geometry, create3DMaterial());
      const rightMesh = new THREE.Mesh(geometry, create3DMaterial());

      // 1. 왼쪽 캐릭터 배치 (좌측 하단)
      leftMesh.scale.set(1.0, 1.0, 1.0);
      leftMesh.position.set(-2.2, -0.6, 0);
      scene.add(leftMesh);

      // 2. 오른쪽 캐릭터 배치 (요청하신 대로 화면 오른쪽 영역으로 완전히 분리)
      rightMesh.scale.set(0.65, 0.65, 0.65);
      rightMesh.position.set(2.6, 1.0, -1.5);
      scene.add(rightMesh);

      const clock = new THREE.Clock();
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

      function animate() {
        requestAnimationFrame(animate);
        const time = clock.getElapsedTime();

        mouse.x += (target.x - mouse.x) * 0.08;
        mouse.y += (target.y - mouse.y) * 0.08;

        // 마우스 움직임에 따라 좌우 캐릭터가 각기 다른 각도로 입체 회전
        leftMesh.rotation.y = mouse.x * 0.4 + Math.sin(time * 0.4) * 0.15;
        leftMesh.rotation.x = -mouse.y * 0.3 + Math.cos(time * 0.5) * 0.1;

        rightMesh.rotation.y = -mouse.x * 0.3 + Math.cos(time * 0.3) * 0.12;
        rightMesh.rotation.x = mouse.y * 0.2 + Math.sin(time * 0.4) * 0.08;

        // 셰이더 시간 업데이트 (입체 웨이브 및 하이라이트 애니메이션)
        [leftMesh, rightMesh].forEach(mesh => {
          if (mesh.material.uniforms && mesh.material.uniforms.uTime) {
            mesh.material.uniforms.uTime.value = time;
          }
        });

        renderer.render(scene, camera);
      }
      animate();
    },
    undefined,
    (error) => {
      console.error("Profile image load error:", error);
    }
  );
}
