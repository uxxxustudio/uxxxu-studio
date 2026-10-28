/* =========================================================
   Component Loader
========================================================= */

async function loadComponent(id, file) {
    const target = document.getElementById(id);
    if (!target) return;

    const res = await fetch(file, { cache: "no-cache" });

    if (!res.ok) {
        console.error(file + " load failed");
        return;
    }

    target.innerHTML = await res.text();

    // service 섹션이 DOM에 로드되는 순간 3D 오브젝트 초기화 및 감지 시작
    if (id === "service") {
        initExperienceFeature();
    }

    // portfolio 섹션이 DOM에 로드되는 순간 Portfolio W 3D 오브젝트 및 호버 썸네일 초기화
    if (id === "portfolio") {
        initPortfolioFeature();
        initPortfolioHoverThumbnail();
    }

    // about 섹션이 DOM에 로드되는 순간 Profile 3D 캐릭터 초기화
    if (id === "about") {
        initProfileFeature();
        initAboutMotion();
        initAboutProfilePosition();
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

                /* 최상단에서는 메뉴를 닫으면 헤더도 원래 상태로 복귀 */
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
    try {
        const { initHero3D } = await import("./hero3d-coin.js?v=6");
        if (typeof initHero3D === "function") {
            initHero3D();
        }
    } catch (e) {
        console.error("Hero 3D 로딩 실패:", e);
    }


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

    /* 스크롤하면 모바일 메뉴 닫기 */
    if (nav) {
        nav.classList.remove("open");
        const menuToggle = document.querySelector(".menu-toggle");
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
        // 1. 데스크톱 & 모바일 3D 오브젝트 생성 함수 호출
        const { initSectionObject } = await import("./hero3d-coin.js?v=6");

        // 데스크톱 3D 호출
        const desktopObject = document.getElementById("experience-object");
        if (desktopObject) {
            initSectionObject("experience-object", "U");
        }

        // 모바일 3D 호출
        const mobileObject = document.getElementById("experience-object-mobile");
        if (mobileObject) {
            initSectionObject("experience-object-mobile", "U");
        }

        // 2. 관찰 대상 섹션 탐색 (experience 또는 service 컨테이너)
        const experienceSection = document.getElementById("experience") || document.getElementById("service");

        // 섹션 대상이 아예 없으면 안전하게 종료
        if (!experienceSection) return;

        const observer = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        if (desktopObject) {
                            desktopObject.classList.add("is-visible");
                        }
                        if (mobileObject) {
                            mobileObject.classList.add("is-visible");
                        }
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1
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
        const { initPortfolio3D } = await import("./hero3d-coin.js?v=6");
        if (document.getElementById("portfolio-object")) {
            initPortfolio3D("portfolio-object");
        }
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
        const { initProfile3D } = await import("./hero3d-coin.js?v=6");
        if (document.getElementById("profile-object")) {
            initProfile3D("profile-object");
        }
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

    const portfolio = document.getElementById("portfolio");
    if (!portfolio) return;

    const grid = portfolio.querySelector(".portfolio-grid");
    if (!grid) return;

    const projects = portfolio.querySelectorAll(".project");
    if (!projects.length) return;

    /* 기존 preview가 있으면 중복 생성하지 않음 */
    let preview = grid.querySelector(".portfolio-preview");

    if (!preview) {
        preview = document.createElement("div");
        preview.className = "portfolio-preview";
        preview.setAttribute("aria-hidden", "true");

        const image = document.createElement("img");
        image.id = "portfolio-preview-image";
        image.alt = "";

        preview.appendChild(image);
        grid.appendChild(preview);
    }

    const image = preview.querySelector("#portfolio-preview-image");

    projects.forEach((project) => {

        project.addEventListener("mouseenter", () => {
            const thumb = project.dataset.thumb;
            if (!thumb) return;

            image.src = thumb;

            const projectRect = project.getBoundingClientRect();
            const gridRect = grid.getBoundingClientRect();

            preview.style.left = (projectRect.left - gridRect.left + Math.min(projectRect.width, 1120) - 300) + "px";
            preview.style.top = (projectRect.top - gridRect.top + 30) + "px";

            preview.classList.add("is-visible");
        });

        project.addEventListener("mouseleave", () => {
            preview.classList.remove("is-visible");
        });

    });

}


/* =========================================================
   About 섹션 등장 모션 (헤드라인 순차 등장 + 타임라인 점 이동)
========================================================= */

function initAboutMotion() {

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const targets = document.querySelectorAll("#about .about-copy, #about .about-profile, #about .about-timeline");
    if (!targets.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("is-in");
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    targets.forEach(target => {
        target.classList.add("about-motion");
        observer.observe(target);
    });

}


/* =========================================================
   About 프로필 동전 위치: 제목 첫 줄 "Experience shapes"의 실제 글자 폭 기준
   (글자 오른쪽 끝에서 OVERLAP px 만큼 동전이 안쪽으로 걸침)
========================================================= */

function initAboutProfilePosition() {

    const wrapper = document.querySelector("#about .about-headline");
    const heading = wrapper && wrapper.querySelector("h2");
    const profile = document.getElementById("profile-object");
    if (!wrapper || !heading || !profile) return;

    const textNode = Array.from(heading.childNodes).find(
        node => node.nodeType === Node.TEXT_NODE && node.textContent.trim()
    );
    if (!textNode) return;

    const place = () => {
        const range = document.createRange();
        range.selectNodeContents(textNode);
        const text = range.getBoundingClientRect();
        const box = wrapper.getBoundingClientRect();
        if (!text.width) return;
        /* 동전 원판 반지름(데스크톱 약 100px)을 기준으로, 글자 끝에서 OVERLAP px 만큼 안쪽으로 걸치게 배치
           → 겹침 정도를 바꾸려면 OVERLAP 숫자만 조절 (클수록 shapes 글자를 더 덮음)
           동전 크기가 줄어드는 화면에서는 같은 비율로 줄어듦 */
        const OVERLAP = 35;
        const scale = profile.offsetWidth / 300;
        const discRadius = profile.offsetWidth * 0.33;
        let center = text.right - box.left + discRadius - OVERLAP * scale;

        /* 좁은 화면: 동전이 화면 오른쪽 밖으로 나가지 않도록 8px 여백을 두고 멈춤 */
        const maxCenter = document.documentElement.clientWidth - 8 - discRadius - box.left;
        center = Math.min(center, maxCenter);

        profile.style.left = center + "px";
    };

    place();
    window.addEventListener("resize", place);
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(place);
    }

}
