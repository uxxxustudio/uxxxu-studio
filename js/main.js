/* =========================================================
   Component Loader
========================================================= */

async function loadComponent(id, file) {
    const target = document.getElementById(id);
    if (!target) return;

    const res = await fetch(file);

    if (!res.ok) {
        console.error(file + " load failed");
        return;
    }

    target.innerHTML = await res.text();

    // service 섹션이 DOM에 로드되는 순간 3D 오브젝트 초기화 및 감지 시작
    if (id === "service") {
        initExperienceFeature();
    }

    // portfolio 섹션이 DOM에 로드되는 순간 Portfolio W 3D 오브젝트 초기화
    if (id === "portfolio") {

        initPortfolioFeature();

        initPortfolioHoverThumbnail();

    }

    // about 섹션이 DOM에 로드되는 순간 Profile 3D 캐릭터 초기화
    if (id === "about") {
        initProfileFeature();
    }
}


/* =========================================================
   Component Path
========================================================= */

const componentPath = new URL(
    "../components/",
    import.meta.url
);


/* =========================================================
   Initialize
========================================================= */

window.addEventListener("DOMContentLoaded", async () => {

    await loadComponent(
        "header",
        new URL("header.html", componentPath)
    );


/* =====================================================
       Mobile Menu
===================================================== */

    const menuToggle = document.querySelector(".menu-toggle");
    const nav = document.querySelector("#header > header nav");
    const header = document.querySelector("#header > header");

    if (menuToggle && nav) {

        menuToggle.addEventListener("click", () => {

            nav.classList.toggle("open");

            const isOpen = nav.classList.contains("open");

            menuToggle.setAttribute(
                "aria-expanded",
                isOpen ? "true" : "false"
            );


            /* 메뉴가 열리면 헤더도 반투명 상태 */

            if (header) {

                if (isOpen) {

                    header.classList.add("active");

                } else if (window.scrollY <= 30) {

                    header.classList.remove("active");

                }

            }

        });


        /* 모바일 메뉴 클릭 시 자동으로 닫기 */

        nav.querySelectorAll("a").forEach(link => {

            link.addEventListener("click", () => {

                nav.classList.remove("open");

                menuToggle.setAttribute(
                    "aria-expanded",
                    "false"
                );


                /* 최상단에서는 메뉴를 닫으면
                   헤더도 원래 상태로 복귀 */

                if (header && window.scrollY <= 30) {
                    header.classList.remove("active");
                }

            });

        });

    }


    await loadComponent(
        "hero",
        new URL("hero.html", componentPath)
    );


    /* Hero가 DOM에 들어온 뒤 3D 실행 */

    const { initHero3D } = await import("./hero3d.js");

    initHero3D();


    await loadComponent(
        "service",
        new URL("service.html", componentPath)
    );


    await loadComponent(
        "portfolio",
        new URL("portfolio.html", componentPath)
    );


    await loadComponent(
        "about",
        new URL("about.html", componentPath)
    );


    /*
    await loadComponent(
        "contact",
        new URL("contact.html", componentPath)
    );
    */


    await loadComponent(
        "footer",
        new URL("footer.html", componentPath)
    );

});


/* =========================================================
   Header Scroll
========================================================= */

window.addEventListener("scroll", () => {

    const header = document.querySelector("#header > header");
    const nav = document.querySelector("#header > header nav");

    if (!header) return;


    if (window.scrollY > 30) {
        header.classList.add("active");
    } else {
        header.classList.remove("active");
    }


    /*
       스크롤하면 모바일 메뉴 닫기
    */

    if (nav) {
        nav.classList.remove("open");

        const menuToggle =
            document.querySelector(".menu-toggle");

        if (menuToggle) {
            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    }

});


/* =========================================================
   Experience 섹션 3D 오브젝트 초기화 및 스크롤 등장 감지
========================================================= */

async function initExperienceFeature() {

    try {

        // 1. 3D 오브젝트 생성 함수 호출

        const { initSectionObject } =
            await import("./hero3d.js");

        initSectionObject(
            "experience-object",
            "U"
        );


        // 2. 스크롤 위치 감지하여 .is-visible 클래스 추가

        const objectElement =
            document.getElementById("experience-object");

        const experienceSection =
            document.getElementById("experience");


        if (!objectElement || !experienceSection) return;


        const observer =
            new IntersectionObserver(
                (entries, observer) => {

                    entries.forEach(entry => {

                        if (entry.isIntersecting) {

                            objectElement.classList.add(
                                "is-visible"
                            );

                            observer.unobserve(
                                entry.target
                            );

                        }

                    });

                },
                {
                    threshold: 0.2
                }
            );


        observer.observe(experienceSection);

    } catch (error) {

        console.error(
            "Experience 3D object initialization failed:",
            error
        );

    }

}


/* =========================================================
   Portfolio 섹션 3D 오브젝트 ("W") 초기화
========================================================= */

async function initPortfolioFeature() {

    try {

        const { initPortfolio3D } =
            await import("./hero3d.js");

        initPortfolio3D(
            "portfolio-object"
        );

    } catch (error) {

        console.error(
            "Portfolio 3D object initialization failed:",
            error
        );

    }

}


/* =========================================================
   Profile 섹션 3D 캐릭터 초기화
========================================================= */

async function initProfileFeature() {

    try {

        const { initProfile3D } =
            await import("./hero3d.js");

        initProfile3D(
            "profile-object"
        );

    } catch (error) {

        console.error(
            "Profile 3D object initialization failed:",
            error
        );

    }

}


/* =========================================================
   Portfolio Hover Thumbnail
========================================================= */

function initPortfolioHoverThumbnail() {

    const portfolio =
        document.getElementById("portfolio");

    if (!portfolio) return;


    const projects =
        portfolio.querySelectorAll(".project");

    if (!projects.length) return;


    /* 기존 preview가 있으면 중복 생성하지 않음 */

    let preview =
        document.querySelector(".portfolio-preview");

    if (!preview) {

        preview =
            document.createElement("div");

        preview.className =
            "portfolio-preview";

        preview.setAttribute(
            "aria-hidden",
            "true"
        );


        const image =
            document.createElement("img");

        image.id =
            "portfolio-preview-image";

        image.alt = "";


        preview.appendChild(image);

        document.body.appendChild(preview);

    }


    const image =
        preview.querySelector(
            "#portfolio-preview-image"
        );


    projects.forEach((project) => {

        project.addEventListener(
            "mouseenter",
            () => {

                const thumb =
                    project.dataset.thumb;

                if (!thumb) return;


                image.src = thumb;


                /*
                   썸네일을 현재 프로젝트 행 기준으로 배치.
                   viewport가 아니라 문서 좌표를 사용하므로
                   스크롤해도 화면을 따라다니지 않음.
                */

                const rect =
                    project.getBoundingClientRect();


                const left =
                    rect.right - 190;


                const top =
                    rect.top +
                    window.scrollY +
                    20;


                preview.style.setProperty(
                    "position",
                    "absolute",
                    "important"
                );


                preview.style.setProperty(
                    "left",
                    `${left + window.scrollX}px`,
                    "important"
                );


                preview.style.setProperty(
                    "top",
                    `${top}px`,
                    "important"
                );


                preview.classList.add(
                    "is-visible"
                );

            }
        );


        project.addEventListener(
            "mouseleave",
            () => {

                preview.classList.remove(
                    "is-visible"
                );

            }
        );

    });

}
