// js/hero3d-test.js
// UXXXU 3D Character TEST
// 원본 SVG를 면으로 변환하지 않고,
// 여러 깊이 레이어 + 3D transform + 마우스 인터랙션으로 입체감 구현

const container = document.getElementById("character");

if (!container) {
    throw new Error("#character element not found.");
}

// --------------------------------------------------
// 기본 설정
// --------------------------------------------------

const SVG_PATH = "../assets/images/ne.svg";

const LAYER_COUNT = 9;
const DEPTH = 2.2;

let mouseX = 0;
let mouseY = 0;

let targetRotateX = 0;
let targetRotateY = 0;

let currentRotateX = 0;
let currentRotateY = 0;

let currentMoveX = 0;
let currentMoveY = 0;


// --------------------------------------------------
// 컨테이너
// --------------------------------------------------

container.innerHTML = "";

container.style.position = "relative";
container.style.width = "100%";
container.style.height = "100%";
container.style.overflow = "visible";

container.style.perspective = "1400px";
container.style.perspectiveOrigin = "50% 50%";


// --------------------------------------------------
// 3D 무대
// --------------------------------------------------

const stage = document.createElement("div");

stage.style.position = "absolute";
stage.style.left = "50%";
stage.style.top = "50%";

stage.style.width = "min(82vw, 900px)";
stage.style.height = "min(82vh, 900px)";

stage.style.transformStyle = "preserve-3d";

stage.style.transform =
    "translate(-50%, -50%) translateZ(0)";

stage.style.willChange = "transform";

container.appendChild(stage);


// --------------------------------------------------
// SVG 레이어 생성
// --------------------------------------------------

const layers = [];

for (let i = 0; i < LAYER_COUNT; i++) {

    const img = document.createElement("img");

    img.src = SVG_PATH;

    img.alt = "";

    img.draggable = false;

    img.style.position = "absolute";
    img.style.left = "0";
    img.style.top = "0";

    img.style.width = "100%";
    img.style.height = "100%";

    img.style.objectFit = "contain";

    img.style.display = "block";

    img.style.pointerEvents = "none";

    img.style.transformStyle = "preserve-3d";

    img.style.userSelect = "none";

    // ------------------------------------------------
    // 뒤쪽 레이어
    // ------------------------------------------------

    const depth = (i - (LAYER_COUNT - 1)) * DEPTH;

    img.style.transform =
        `translate3d(0, 0, ${depth}px)`;

    // 뒤로 갈수록 조금 어둡게
    const normalized = i / (LAYER_COUNT - 1);

    img.style.opacity =
        String(0.16 + normalized * 0.84);

    // ------------------------------------------------
    // 앞쪽 레이어는 약간 밝게
    // ------------------------------------------------

    if (i === LAYER_COUNT - 1) {

        img.style.filter = `
            drop-shadow(0 0 3px rgba(220,255,230,.75))
            drop-shadow(0 0 10px rgba(150,255,190,.35))
        `;

    } else {

        img.style.filter = `
            drop-shadow(0 0 2px rgba(120,255,170,.22))
        `;
    }

    stage.appendChild(img);

    layers.push({
        element: img,
        baseZ: depth
    });
}


// --------------------------------------------------
// 은은한 뒤쪽 Glow
// --------------------------------------------------

const glow = document.createElement("img");

glow.src = SVG_PATH;

glow.alt = "";

glow.draggable = false;

glow.style.position = "absolute";
glow.style.left = "0";
glow.style.top = "0";

glow.style.width = "100%";
glow.style.height = "100%";

glow.style.objectFit = "contain";

glow.style.pointerEvents = "none";

glow.style.opacity = "0.16";

glow.style.filter = `
    blur(12px)
    brightness(1.4)
    drop-shadow(0 0 22px rgba(130,255,180,.65))
`;

glow.style.transform =
    "translate3d(0, 0, -28px) scale(1.015)";

stage.insertBefore(glow, stage.firstChild);


// --------------------------------------------------
// 마우스 인터랙션
// --------------------------------------------------

container.addEventListener("pointermove", (event) => {

    const rect = container.getBoundingClientRect();

    const x =
        (event.clientX - rect.left) / rect.width;

    const y =
        (event.clientY - rect.top) / rect.height;

    mouseX = (x - 0.5) * 2;
    mouseY = (y - 0.5) * 2;

    // 너무 과하게 돌아가지 않도록 제한
    targetRotateY = mouseX * 9;
    targetRotateX = -mouseY * 7;

});


// --------------------------------------------------
// 마우스가 화면 밖으로 나가면 원위치
// --------------------------------------------------

container.addEventListener("pointerleave", () => {

    mouseX = 0;
    mouseY = 0;

    targetRotateX = 0;
    targetRotateY = 0;

});


// --------------------------------------------------
// 애니메이션
// --------------------------------------------------

function animate() {

    requestAnimationFrame(animate);

    // 부드러운 easing
    currentRotateX +=
        (targetRotateX - currentRotateX) * 0.055;

    currentRotateY +=
        (targetRotateY - currentRotateY) * 0.055;

    // ------------------------------------------------
    // 아주 미세한 부유감
    // ------------------------------------------------

    const time = performance.now() * 0.001;

    const floatY =
        Math.sin(time * 0.75) * 3;

    const floatRotate =
        Math.sin(time * 0.55) * 0.35;

    // ------------------------------------------------
    // 전체 3D 캐릭터
    // ------------------------------------------------

    stage.style.transform = `
        translate(-50%, -50%)
        translate3d(
            ${mouseX * 5}px,
            ${floatY + mouseY * 3}px,
            0
        )
        rotateX(${currentRotateX + floatRotate}deg)
        rotateY(${currentRotateY}deg)
    `;

    // ------------------------------------------------
    // 각각의 레이어에 아주 미세한 움직임
    // → 단순 이미지 한 장보다 깊이감이 생김
    // ------------------------------------------------

    layers.forEach((layer, index) => {

        const depthRatio =
            index / (LAYER_COUNT - 1);

        const layerX =
            mouseX * depthRatio * 1.8;

        const layerY =
            mouseY * depthRatio * 1.2;

        layer.element.style.transform = `
            translate3d(
                ${layerX}px,
                ${layerY}px,
                ${layer.baseZ}px
            )
        `;
    });

    // ------------------------------------------------
    // Glow도 같이 따라오되 살짝 느슨하게
    // ------------------------------------------------

    glow.style.transform = `
        translate3d(
            ${mouseX * -2}px,
            ${mouseY * -1.5}px,
            -28px
        )
        scale(1.015)
    `;
}

animate();


// --------------------------------------------------
// 이미지 로딩 실패 확인
// --------------------------------------------------

layers.forEach((layer) => {

    layer.element.addEventListener("error", () => {

        console.error(
            "SVG를 불러오지 못했습니다:",
            SVG_PATH
        );

    });

});
