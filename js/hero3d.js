/* =====================================================
     ★ SHARP SUNBEAM RAYS BACKGROUND (레퍼런스 동일 사선 광선)
  ===================================================== */
  const lightRayGeo = new THREE.PlaneGeometry(38, 26);
  const lightRayMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uBgBase: { value: new THREE.Color(0x9bc3eb) },   // 은은한 블루 베이스
      uSunColor: { value: new THREE.Color(0xfffef0) }, // 화사한 햇살 웜화이트
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

      // 선명한 사선 광선(Ray) 생성을 위한 노이즈 수식
      float hash(float n) { return fract(sin(n) * 43758.5453123); }
      float noise(vec2 x) {
        vec2 p = floor(x);
        vec2 f = fract(x);
        f = f * f * (3.0 - 2.0 * f);
        float n = p.x + p.y * 57.0;
        return mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                   mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y);
      }

      void main() {
        vec2 st = vUv;

        // 사선 각도 세팅 (좌상단 -> 우하단)
        vec2 rayOrigin = vec2(-0.2, 1.2) + uMouse * 0.08;
        vec2 rayDir = st - rayOrigin;
        
        // angle & distance 변환
        float angle = atan(rayDir.y, rayDir.x);
        float dist = length(rayDir);

        // 뚜렷하게 부서지는 사선 광선 패턴 생성
        float rayPattern = noise(vec2(angle * 12.0, uTime * 0.05));
        rayPattern += noise(vec2(angle * 24.0, 0.0)) * 0.5;

        // 블러처럼 퍼지지 않게 선명도를 고주파(pow)로 끌어올림
        float rays = pow(rayPattern, 2.8);

        // 거리 감소 감쇄 (좌상단은 쨍하고 우하단으로 갈수록 부드러워짐)
        float attenuation = smoothstep(2.2, 0.2, dist);

        // 최종 빛 줄기 강도 계산
        float finalBeam = rays * attenuation * 1.8;

        // 선명한 코어 렌즈 광원 추가
        float core = pow(smoothstep(0.9, 0.0, dist), 2.0) * 0.8;

        float totalLight = clamp(finalBeam + core, 0.0, 1.0);

        // 베이스 컬러와 선명한 햇살 광선 선형 합성
        vec3 finalBg = mix(uBgBase, uSunColor, totalLight * 0.85);

        gl_FragColor = vec4(finalBg, 1.0);
      }
    `,
    depthWrite: false,
  });
