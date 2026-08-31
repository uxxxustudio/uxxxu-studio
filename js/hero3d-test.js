import * as THREE from 'three';

/* =========================================================
   UXXXU 3D CHARACTER TEST
   Source: assets/images/ne.svg

   - Uses the original SVG artwork.
   - No reconstructed 3D character geometry.
   - Transparent line artwork only.
   - Subtle 3D curvature + mouse parallax.
========================================================= */

const container = document.getElementById('character');

if (!container) {
    throw new Error('#character element not found.');
}

/* ---------------------------------------------------------
   Renderer
--------------------------------------------------------- */

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, 2)
);

renderer.setSize(
    container.clientWidth,
    container.clientHeight
);

renderer.setClearColor(0x000000, 0);

renderer.outputColorSpace = THREE.SRGBColorSpace;

container.appendChild(renderer.domElement);


/* ---------------------------------------------------------
   Scene
--------------------------------------------------------- */

const scene = new THREE.Scene();


/* ---------------------------------------------------------
   Camera
--------------------------------------------------------- */

const camera = new THREE.PerspectiveCamera(
    38,
    container.clientWidth / container.clientHeight,
    0.1,
    100
);

camera.position.set(0, 0, 7);
camera.lookAt(0, 0, 0);


/* ---------------------------------------------------------
   SVG texture
--------------------------------------------------------- */

const textureLoader = new THREE.TextureLoader();

const characterTexture = textureLoader.load(
    './assets/images/ne.svg',
    (texture) => {

        texture.colorSpace = THREE.SRGBColorSpace;

        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;

        texture.needsUpdate = true;
    }
);


/* =========================================================
   Shader
   ---------------------------------------------------------
   ne.svg contains black artwork with transparency.

   We invert the RGB value:
   black line -> white line

   Transparency remains untouched.
========================================================= */

const lineVertexShader = `
    uniform float uBend;
    uniform float uTime;

    varying vec2 vUv;

    void main() {

        vUv = uv;

        vec3 p = position;

        /*
         * Very subtle horizontal curvature.
         * Keeps the original artwork readable from the front.
         */
        float x = p.x;

        p.z += (x * x) * uBend;

        /*
         * Tiny breathing movement.
         */
        p.z += sin(uTime * 0.65) * 0.015;

        gl_Position =
            projectionMatrix *
            modelViewMatrix *
            vec4(p, 1.0);
    }
`;


const lineFragmentShader = `
    uniform sampler2D uTexture;
    uniform float uOpacity;
    uniform vec3 uColor;

    varying vec2 vUv;

    void main() {

        vec4 tex = texture2D(
            uTexture,
            vUv
        );

        /*
         * Original artwork is black.
         * Convert black -> white/color.
         */
        float luminance =
            dot(
                tex.rgb,
                vec3(
                    0.299,
                    0.587,
                    0.114
                )
            );

        float line =
            1.0 - luminance;

        /*
         * Keep the original transparency.
         */
        float alpha =
            line *
            tex.a *
            uOpacity;

        if (alpha < 0.008) {
            discard;
        }

        gl_FragColor = vec4(
            uColor,
            alpha
        );
    }
`;


/* =========================================================
   Glow shader
========================================================= */

const glowVertexShader = `
    uniform float uBend;

    varying vec2 vUv;

    void main() {

        vUv = uv;

        vec3 p = position;

        float x = p.x;

        p.z += (x * x) * uBend;

        /*
         * Glow layer sits slightly behind.
         */
        p.z -= 0.035;

        gl_Position =
            projectionMatrix *
            modelViewMatrix *
            vec4(p, 1.0);
    }
`;


const glowFragmentShader = `
    uniform sampler2D uTexture;
    uniform vec3 uColor;
    uniform float uOpacity;

    varying vec2 vUv;

    void main() {

        vec4 tex =
            texture2D(
                uTexture,
                vUv
            );

        float luminance =
            dot(
                tex.rgb,
                vec3(
                    0.299,
                    0.587,
                    0.114
                )
            );

        float line =
            1.0 - luminance;

        float alpha =
            line *
            tex.a *
            uOpacity;

        if (alpha < 0.003) {
            discard;
        }

        gl_FragColor =
            vec4(
                uColor,
                alpha
            );
    }
`;


/* ---------------------------------------------------------
   Artwork group
--------------------------------------------------------- */

const artwork = new THREE.Group();

scene.add(artwork);


/* ---------------------------------------------------------
   Main line plane
--------------------------------------------------------- */

const geometry = new THREE.PlaneGeometry(
    5.8,
    5.8 * (1024 / 1536),
    48,
    32
);


const lineMaterial = new THREE.ShaderMaterial({

    uniforms: {

        uTexture: {
            value: characterTexture
        },

        uOpacity: {
            value: 1.0
        },

        uColor: {
            value: new THREE.Color(0xf3fff7)
        },

        uBend: {
            value: 0.075
        },

        uTime: {
            value: 0
        }
    },

    vertexShader: lineVertexShader,

    fragmentShader: lineFragmentShader,

    transparent: true,

    depthWrite: false,

    depthTest: false,

    side: THREE.DoubleSide
});


const characterPlane =
    new THREE.Mesh(
        geometry,
        lineMaterial
    );

artwork.add(characterPlane);


/* =========================================================
   Glow layers
   ---------------------------------------------------------
   Same original artwork, duplicated behind itself.
========================================================= */

function createGlow(
    scale,
    opacity,
    z
) {

    const glowMaterial =
        new THREE.ShaderMaterial({

            uniforms: {

                uTexture: {
                    value: characterTexture
                },

                uOpacity: {
                    value: opacity
                },

                uColor: {
                    value: new THREE.Color(
                        0x8fffc0
                    )
                },

                uBend: {
                    value: 0.075
                }
            },

            vertexShader:
                glowVertexShader,

            fragmentShader:
                glowFragmentShader,

            transparent: true,

            depthWrite: false,

            depthTest: false,

            blending:
                THREE.AdditiveBlending,

            side:
                THREE.DoubleSide
        });


    const mesh =
        new THREE.Mesh(
            geometry,
            glowMaterial
        );

    mesh.scale.set(
        scale,
        scale,
        scale
    );

    mesh.position.z = z;

    artwork.add(mesh);

    return mesh;
}


/*
 * Soft outer glow
 */
createGlow(
    1.018,
    0.10,
    -0.08
);


/*
 * Slightly stronger inner glow
 */
createGlow(
    1.008,
    0.16,
    -0.045
);


/* ---------------------------------------------------------
   Initial artwork position
--------------------------------------------------------- */

artwork.position.set(
    0,
    0.05,
    0
);


/* =========================================================
   Mouse interaction
========================================================= */

const pointer = {
    x: 0,
    y: 0
};

const targetRotation = {
    x: 0,
    y: 0
};

const currentRotation = {
    x: 0,
    y: 0
};


function updatePointer(event) {

    const rect =
        container.getBoundingClientRect();

    pointer.x =
        (
            (event.clientX - rect.left)
            / rect.width
        ) * 2 - 1;

    pointer.y =
        -(
            (event.clientY - rect.top)
            / rect.height
        ) * 2 + 1;

    targetRotation.y =
        pointer.x * 0.075;

    targetRotation.x =
        pointer.y * 0.045;
}


window.addEventListener(
    'pointermove',
    updatePointer,
    {
        passive: true
    }
);


/* ---------------------------------------------------------
   Touch support
--------------------------------------------------------- */

window.addEventListener(
    'touchmove',
    (event) => {

        if (!event.touches.length) {
            return;
        }

        const touch =
            event.touches[0];

        updatePointer({
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    },
    {
        passive: true
    }
);


/* =========================================================
   Resize
========================================================= */

function resize() {

    const width =
        container.clientWidth;

    const height =
        container.clientHeight;

    if (!width || !height) {
        return;
    }

    renderer.setSize(
        width,
        height
    );

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );

    camera.aspect =
        width / height;

    camera.updateProjectionMatrix();

    /*
     * Keep the character comfortably inside
     * the viewport on both desktop and mobile.
     */
    const isMobile =
        width < 700;

    const scale =
        isMobile
            ? 0.88
            : 1.0;

    artwork.scale.set(
        scale,
        scale,
        scale
    );
}


window.addEventListener(
    'resize',
    resize
);

resize();


/* =========================================================
   Animation
========================================================= */

const clock =
    new THREE.Clock();


function animate() {

    requestAnimationFrame(
        animate
    );

    const elapsed =
        clock.getElapsedTime();


    /*
     * Send time to main shader.
     */
    lineMaterial.uniforms.uTime.value =
        elapsed;


    /*
     * Smooth mouse movement.
     */
    currentRotation.y +=
        (
            targetRotation.y -
            currentRotation.y
        ) * 0.055;

    currentRotation.x +=
        (
            targetRotation.x -
            currentRotation.x
        ) * 0.055;


    /*
     * Very subtle idle movement.
     */
    const idleY =
        Math.sin(
            elapsed * 0.45
        ) * 0.012;

    const idleX =
        Math.sin(
            elapsed * 0.32
        ) * 0.006;


    artwork.rotation.y =
        currentRotation.y +
        idleY;

    artwork.rotation.x =
        currentRotation.x +
        idleX;


    /*
     * Tiny floating movement.
     */
    artwork.position.y =
        0.05 +
        Math.sin(
            elapsed * 0.55
        ) * 0.018;


    renderer.render(
        scene,
        camera
    );
}


animate();


/* =========================================================
   Cleanup
========================================================= */

window.addEventListener(
    'beforeunload',
    () => {

        geometry.dispose();

        lineMaterial.dispose();

        characterTexture.dispose();

        renderer.dispose();
    }
);
