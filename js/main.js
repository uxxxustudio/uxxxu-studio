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
        [추가] Experience 섹션 로드 완료 후 3D 오브젝트 실행
    ========================================================= */
    import("./hero3d.js").then(({ initSectionObject }) => {
        initSectionObject("experience-object", "U"); // "U" 또는 원하는 글자 입력 가능
    });

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
   Experience 3D 오브젝트 등장 모션 감지 (비동기 로드 대응)
========================================================= */

const checkExperienceObject = setInterval(() => {
    const objectElement = document.getElementById('experience-object');
    const experienceSection = document.getElementById('experience');

    if (objectElement && experienceSection) {
        clearInterval(checkExperienceObject); // 엘리먼트를 찾으면 인터벌 중지

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

        observer.observe(experienceSection);
    }
}, 100); // 0.1초마다 엘리먼트가 생성되었는지 체크 후 바인딩
