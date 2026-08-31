/* =========================================================
   UXXXU CHARACTER 3D TEST
   - translucent 3D character
   - holographic / wireframe feel
   - green accent
   - mouse interaction
========================================================= */

export async function initHero3D() {

    const container =
        document.getElementById("character");

    if (!container) {
        console.warn("character container not found");
        return;
    }

    try {

        const THREE =
            await import("https://esm.sh/three@0.180.0");


        /* =====================================================
           SCENE
        ===================================================== */

        const scene =
            new THREE.Scene();


        /* =====================================================
           CAMERA
        ===================================================== */

        const camera =
            new THREE.PerspectiveCamera(
                30,
                container.clientWidth /
                container.clientHeight,
                0.1,
                100
            );

        camera.position.set(
            0,
            0.15,
            11
        );


        /* =====================================================
           RENDERER
        ===================================================== */

        const renderer =
            new THREE.WebGLRenderer({
                antialias: true,
                alpha: true
            });

        renderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 2)
        );

        renderer.setSize(
            container.clientWidth,
            container.clientHeight
        );

        renderer.setClearColor(
            0x000000,
            0
        );

        container.appendChild(
            renderer.domElement
        );


        /* =====================================================
           MAIN GROUP
        ===================================================== */

        const character =
            new THREE.Group();

        scene.add(character);


        /* =====================================================
           MATERIALS
        ===================================================== */

        const faceMaterial =
            new THREE.MeshBasicMaterial({
                color: 0xdfe2e3,
                transparent: true,
                opacity: 0.34,
                side: THREE.DoubleSide,
                depthWrite: false
            });


        const bodyMaterial =
            new THREE.MeshBasicMaterial({
                color: 0xcfd3d4,
                transparent: true,
                opacity: 0.24,
                side: THREE.DoubleSide,
                depthWrite: false
            });


        const darkMaterial =
            new THREE.MeshBasicMaterial({
                color: 0x080909,
                transparent: true,
                opacity: 0.88,
                side: THREE.DoubleSide
            });


        const whiteLineMaterial =
            new THREE.LineBasicMaterial({
                color: 0xf5f7f7,
                transparent: true,
                opacity: 0.72
            });


        const greenMaterial =
            new THREE.MeshBasicMaterial({
                color: 0x19e878,
                transparent: true,
                opacity: 0.9
            });


        const greenLineMaterial =
            new THREE.LineBasicMaterial({
                color: 0x19e878,
                transparent: true,
                opacity: 0.95
            });


        /* =====================================================
           HELPERS
        ===================================================== */

        function addWireObject(
            geometry,
            material,
            lineMaterial = whiteLineMaterial,
            threshold = 18
        ) {

            const mesh =
                new THREE.Mesh(
                    geometry,
                    material
                );

            const edgesGeometry =
                new THREE.EdgesGeometry(
                    geometry,
                    threshold
                );

            const edges =
                new THREE.LineSegments(
                    edgesGeometry,
                    lineMaterial
                );

            const group =
                new THREE.Group();

            group.add(mesh);
            group.add(edges);

            character.add(group);

            return group;
        }


        /* =====================================================
           HEAD
        ===================================================== */

        const headGeometry =
            new THREE.SphereGeometry(
                2.05,
                48,
                32
            );

        const head =
            addWireObject(
                headGeometry,
                faceMaterial,
                whiteLineMaterial,
                22
            );

        head.scale.set(
            0.86,
            1.04,
            0.78
        );

        head.position.set(
            0,
            1.45,
            0
        );


        /* =====================================================
           HAIR
           둥근 젊은 느낌의 짧은 헤어
        ===================================================== */

        const hairGeometry =
            new THREE.SphereGeometry(
                2.13,
                48,
                32,
                0,
                Math.PI * 2,
                0,
                Math.PI * 0.58
            );

        const hair =
            new THREE.Mesh(
                hairGeometry,
                darkMaterial
            );

        hair.scale.set(
            0.87,
            1.02,
            0.80
        );

        hair.position.set(
            0,
            2.0,
            -0.12
        );

        character.add(hair);


        /* =====================================================
           SIDE HAIR
        ===================================================== */

        function createHairSide(x) {

            const geometry =
                new THREE.CapsuleGeometry(
                    0.48,
                    1.45,
                    8,
                    16
                );

            const side =
                new THREE.Mesh(
                    geometry,
                    darkMaterial
                );

            side.position.set(
                x,
                0.95,
                -0.02
            );

            side.rotation.z =
                x < 0 ? -0.08 : 0.08;

            side.scale.set(
                0.85,
                1,
                0.7
            );

            character.add(side);
        }

        createHairSide(-1.58);
        createHairSide(1.58);


        /* =====================================================
           GLASSES
        ===================================================== */

        function createGlassesLens(x) {

            const shape =
                new THREE.Shape();

            const w = 0.88;
            const h = 0.68;
            const r = 0.22;

            shape.moveTo(
                -w + r,
                -h
            );

            shape.lineTo(
                w - r,
                -h
            );

            shape.quadraticCurveTo(
                w,
                -h,
                w,
                -h + r
            );

            shape.lineTo(
                w,
                h - r
            );

            shape.quadraticCurveTo(
                w,
                h,
                w - r,
                h
            );

            shape.lineTo(
                -w + r,
                h
            );

            shape.quadraticCurveTo(
                -w,
                h,
                -w,
                h - r
            );

            shape.lineTo(
                -w,
                -h + r
            );

            shape.quadraticCurveTo(
                -w,
                -h,
                -w + r,
                -h
            );


            const geometry =
                new THREE.ExtrudeGeometry(
                    shape,
                    {
                        depth: 0.08,
                        bevelEnabled: false
                    }
                );


            const lens =
                new THREE.Mesh(
                    geometry,
                    darkMaterial
                );

            lens.position.set(
                x,
                1.55,
                1.45
            );

            lens.scale.set(
                0.62,
                0.68,
                1
            );

            character.add(lens);


            const edges =
                new THREE.LineSegments(
                    new THREE.EdgesGeometry(
                        geometry
                    ),
                    greenLineMaterial
                );

            edges.position.copy(
                lens.position
            );

            edges.scale.copy(
                lens.scale
            );

            character.add(edges);
        }


        createGlassesLens(-0.82);
        createGlassesLens(0.82);


        /* =====================================================
           GLASSES BRIDGE
        ===================================================== */

        const bridgeGeometry =
            new THREE.BoxGeometry(
                0.55,
                0.08,
                0.08
            );

        const bridge =
            new THREE.Mesh(
                bridgeGeometry,
                greenMaterial
            );

        bridge.position.set(
            0,
            1.58,
            1.48
        );

        character.add(bridge);


        /* =====================================================
           NOSE
        ===================================================== */

        const noseGeometry =
            new THREE.SphereGeometry(
                0.16,
                20,
                12
            );

        const nose =
            new THREE.Mesh(
                noseGeometry,
                faceMaterial
            );

        nose.scale.set(
            0.75,
            1.5,
            1.2
        );

        nose.position.set(
            0,
            0.95,
            1.52
        );

        character.add(nose);


        /* =====================================================
           SMILE
        ===================================================== */

        const smileCurve =
            new THREE.QuadraticBezierCurve3(
                new THREE.Vector3(
                    -0.42,
                    0.63,
                    1.48
                ),
                new THREE.Vector3(
                    0,
                    0.45,
                    1.58
                ),
                new THREE.Vector3(
                    0.42,
                    0.63,
                    1.48
                )
            );

        const smileGeometry =
            new THREE.BufferGeometry().setFromPoints(
                smileCurve.getPoints(24)
            );

        const smile =
            new THREE.Line(
                smileGeometry,
                whiteLineMaterial
            );

        character.add(smile);


        /* =====================================================
           NECK
        ===================================================== */

        const neckGeometry =
            new THREE.CylinderGeometry(
                0.58,
                0.68,
                1.0,
                32
            );

        const neck =
            addWireObject(
                neckGeometry,
                bodyMaterial,
                whiteLineMaterial,
                20
            );

        neck.position.set(
            0,
            -0.05,
            0
        );


        /* =====================================================
           BODY
           둥근 상체
        ===================================================== */

        const bodyGeometry =
            new THREE.SphereGeometry(
                2.25,
                48,
                32
            );

        const body =
            addWireObject(
                bodyGeometry,
                bodyMaterial,
                whiteLineMaterial,
                22
            );

        body.scale.set(
            1.32,
            0.82,
            0.72
        );

        body.position.set(
            0,
            -1.28,
            0
        );


        /* =====================================================
           SHOULDERS
        ===================================================== */

        const shoulderGeometry =
            new THREE.SphereGeometry(
                1.35,
                32,
                20
            );

        const shoulder =
            addWireObject(
                shoulderGeometry,
                bodyMaterial,
                whiteLineMaterial,
                20
            );

        shoulder.scale.set(
            1.65,
            0.45,
            0.72
        );

        shoulder.position.set(
            0,
            -0.52,
            0
        );


        /* =====================================================
           GREEN HOLOGRAM RING
        ===================================================== */

        const ringGeometry =
            new THREE.TorusGeometry(
                2.55,
                0.035,
                12,
                96
            );

        const ring =
            new THREE.Mesh(
                ringGeometry,
                greenLineMaterial
            );

        ring.rotation.x =
            Math.PI / 2;

        ring.position.set(
            0,
            -0.72,
            0
        );

        character.add(ring);


        /* =====================================================
           SECOND SUBTLE RING
        ===================================================== */

        const ring2Geometry =
            new THREE.TorusGeometry(
                3.35,
                0.018,
                10,
                96
            );

        const ring2 =
            new THREE.Mesh(
                ring2Geometry,
                greenLineMaterial
            );

        ring2.rotation.x =
            Math.PI / 2;

        ring2.position.set(
            0,
            0.55,
            -0.3
        );

        ring2.scale.set(
            1,
            0.32,
            1
        );

        character.add(ring2);


        /* =====================================================
           HOLOGRAM HALO
        ===================================================== */

        const haloGeometry =
            new THREE.RingGeometry(
                3.55,
                3.59,
                96
            );

        const haloMaterial =
            new THREE.MeshBasicMaterial({
                color: 0x6c7777,
                transparent: true,
                opacity: 0.18,
                side: THREE.DoubleSide
            });

        const halo =
            new THREE.Mesh(
                haloGeometry,
                haloMaterial
            );

        halo.position.set(
            0,
            0.7,
            -1.1
        );

        halo.rotation.y =
            Math.PI;

        character.add(halo);


        /* =====================================================
           CHARACTER POSITION
        ===================================================== */

        character.scale.setScalar(
            1.0
        );

        character.position.set(
            0,
            -0.15,
            0
        );


        /* =====================================================
           MOUSE
        ===================================================== */

        const mouse = {
            x: 0,
            y: 0
        };

        const targetMouse = {
            x: 0,
            y: 0
        };


        window.addEventListener(
            "mousemove",
            (event) => {

                targetMouse.x =
                    (event.clientX /
                    window.innerWidth) * 2 - 1;

                targetMouse.y =
                    (event.clientY /
                    window.innerHeight) * 2 - 1;

            }
        );


        /* =====================================================
           RESIZE
        ===================================================== */

        function resize() {

            const width =
                container.clientWidth;

            const height =
                container.clientHeight;

            if (!width || !height) return;

            camera.aspect =
                width / height;

            camera.updateProjectionMatrix();

            renderer.setSize(
                width,
                height
            );
        }


        window.addEventListener(
            "resize",
            resize
        );


        /* =====================================================
           ANIMATION
        ===================================================== */

        const clock =
            new THREE.Clock();


        function animate() {

            requestAnimationFrame(
                animate
            );

            const time =
                clock.getElapsedTime();


            mouse.x +=
                (targetMouse.x - mouse.x) *
                0.035;

            mouse.y +=
                (targetMouse.y - mouse.y) *
                0.035;


            /* 전체 캐릭터의 미세한 움직임 */

            character.rotation.y =
                mouse.x * 0.16;

            character.rotation.x =
                mouse.y * 0.06;


            character.position.y =
                -0.15 +
                Math.sin(time * 0.7) *
                0.08;


            /* 링은 조금 더 느리게 */

            ring.rotation.z =
                time * 0.12;

            ring2.rotation.z =
                -time * 0.08;


            /* 홀로그램 링 밝기 변화 */

            greenLineMaterial.opacity =
                0.72 +
                Math.sin(time * 1.4) *
                0.18;


            renderer.render(
                scene,
                camera
            );
        }


        resize();
        animate();


    } catch (error) {

        console.error(
            "Character Three.js initialization failed:",
            error
        );

    }
}


/* =========================================================
   INITIALIZE
========================================================= */

window.addEventListener(
    "DOMContentLoaded",
    () => {
        initHero3D();
    }
);
