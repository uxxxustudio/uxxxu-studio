import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { BufferGeometryUtils } from "three/addons/utils/BufferGeometryUtils.js";

export function initHero3D() {
  const container = document.getElementById("hero-3d");
  if (!container) return;
  container.innerHTML = "";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, 15);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setClearColor(0xffffff, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const group = new THREE.Group();
  scene.add(group);

  // 1. 아주 촘촘하고 연한 회색 배경 그리드
  const gridHelper = new THREE.GridHelper(50, 40, 0xe5e7eb, 0xe5e7eb);
  gridHelper.rotation.x = Math.PI / 2;
  gridHelper.position.z = -5;
  scene.add(gridHelper);

  // 5. 깔끔한 블랙 라인 머티리얼
  const lineMat = new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.8 });

  const loader = new FontLoader();
  loader.load("https://cdn.jsdelivr.net/npm/three@0.180.0/examples/fonts/helvetiker_bold.typeface.json", (font) => {
    // 3D 텍스트의 외곽선만 추출하여 깔끔하게 정리
    createClean3DLetter("U", font, -2.9, -0.65, 0);
    createClean3DLetter("X", font, 2.25, 0.55, 1.7);
    createClean3DLetter("X", font, -2.3, 3.8, 0.8);
    createClean3DLetter("X", font, 5.3, -3.2, 2.3);
  });

  function createClean3DLetter(char, font, x, y, phase) {
    const geo = new TextGeometry(char, {
      font: font, size: 4.1, depth: 0.5,
      curveSegments: 2, // 곡선 분할을 최소화하여 선을 단순화
      bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.05, bevelSegments: 1
    });
    geo.center();

    // ★ 핵심: EdgesGeometry 대신 사용자가 요청한 깔끔한 라인만 남기기
    // 폰트의 모든 폴리곤을 지우고 오직 외곽 모서리만 뽑아냄
    const edges = new THREE.EdgesGeometry(geo, 15); 
    const lines = new THREE.LineSegments(edges, lineMat);
    
    const obj = new THREE.Group();
    obj.add(lines);
    obj.position.set(x, y, 0);
    obj.userData = { baseX: x, baseY: y, phase: phase };
    group.add(obj);
  }

  function animate() {
    requestAnimationFrame(animate);
    const time = Date.now() * 0.001;
    group.children.forEach((obj, i) => {
      const p = obj.userData;
      obj.position.x = p.baseX + Math.sin(time * 0.5 + p.phase) * 0.1;
      obj.position.y = p.baseY + Math.cos(time * 0.7 + p.phase) * 0.1;
      obj.rotation.y = Math.sin(time * 0.3) * 0.2;
    });
    renderer.render(scene, camera);
  }
  
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  window.addEventListener("resize", resize);
  resize();
  animate();
}
