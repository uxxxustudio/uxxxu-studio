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

    /* =========================================================
        Experience 섹션 3D 오브젝트 실행 (U 유지)
    ========================================================= */
    import("./hero3d.js").then(({ initSectionObject }) => {
        initSectionObject("experience-object", "U"); 
    });

    await loadComponent(
        "portfolio",
        new URL("portfolio.html", componentPath)
    );

    await loadComponent(
        "about",
        new URL("about.html", componentPath)
    );

    /* =========================================================
        [추가] About(프로필) 섹션 로드 완료 후 SVG 캐릭터 3D 실행
        * 프로필 HTML 파일 안에 id="profile-object"인 태그가 있어야 합니다.
    ========================================================= */
    import("./hero3d.js").then(({ initSectionObject }) => {
        initSectionObject("profile-object", "../assets/images/ne.svg");
    });

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

    const header =
        document.querySelector("#header > header");

    const nav =
        document.querySelector("header nav");

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
   Mobile Menu
========================================================= */

window.addEventListener('scroll', () => {
    const objectElement = document.getElementById('experience-object');
    if (!objectElement) return;

    const rect = objectElement.getBoundingClientRect();
    
    if (rect.top < window.innerHeight * 0.5) {
        objectElement.classList.add('is-visible');
    }
});


// EXPERIENCE 섹션 3D 오브젝트 스크롤 등장 모션 감지
document.addEventListener('DOMContentLoaded', () => {
    const objectElement = document.getElementById('experience-object');
    if (!objectElement) return;

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                objectElement.classList.add('is-visible');
                observer.unobserve(entry.target); // 애니메이션이 한 번만 실행되도록 설정
            }
        });
    }, {
        threshold: 0.2 // 섹션이 화면에 20% 보일 때 작동
    });

    const experienceSection = document.getElementById('experience');
    if (experienceSection) {
        observer.observe(experienceSection);
    }
});
