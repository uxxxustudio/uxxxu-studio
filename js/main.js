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

    await loadComponent(
        "contact",
        new URL("contact.html", componentPath)
    );

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
    const nav = document.querySelector("header nav");

    if (!header) return;

    if (window.scrollY > 30) {
        header.classList.add("active");
    } else {
        header.classList.remove("active");
    }

    if (nav) {
        nav.classList.remove("open");
    }
});


/* =========================================================
   Experience 섹션 3D 오브젝트 초기화 및 스크롤 등장 감지
========================================================= */
async function initExperienceFeature() {
    try {
        // 1. 3D 오브젝트 생성 함수 호출
        const { initSectionObject } = await import("./hero3d.js");
        initSectionObject("experience-object", "U");

        // 2. 스크롤 위치 감지하여 .is-visible 클래스 추가
        const objectElement = document.getElementById('experience-object');
        const experienceSection = document.getElementById('experience');

        if (!objectElement || !experienceSection) return;

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    objectElement.classList.add('is-visible');
                    observer.unobserve(entry.target); // 한 번만 실행
                }
            });
        }, {
            threshold: 0.2 // 섹션이 20% 보일 때 작동
        });

        observer.observe(experienceSection);
    } catch (error) {
        console.error("Experience 3D object initialization failed:", error);
    }
}
