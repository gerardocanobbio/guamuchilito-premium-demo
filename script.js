"use strict";

/*
|--------------------------------------------------------------------------
| GUAMUCHILITO AUTOMOTIVE PERFORMANCE
| script.js
|--------------------------------------------------------------------------
| Este archivo controla:
| - header dinámico al hacer scroll
| - menú móvil
| - animaciones reveal al entrar en viewport
| - smooth scroll mejorado
| - efecto parallax ligero en hero
| - hover glow en cards
| - contador numérico en métricas
| - barra de progreso de lectura/scroll
| - marquee infinito del strip inferior del hero
| - efecto tilt en tarjetas premium
| - FAQ con comportamiento refinado
| - botones CTA con microinteracciones
| - observer general para estados "is-visible"
| - utilidades de resize/raf para mejor rendimiento
|--------------------------------------------------------------------------
*/

document.addEventListener("DOMContentLoaded", () => {
  const app = {
    init() {
      this.cacheDom();
      this.createScrollProgressBar();
      this.bindEvents();
      this.initHeaderState();
      this.initMobileMenu();
      this.initRevealSystem();
      this.initSmoothAnchors();
      this.initHeroParallax();
      this.initMetricCounters();
      this.initGlowCards();
      this.initProcessAndFeatureTilt();
      this.initFaqBehavior();
      this.initButtonFeedback();
      this.initStripMotion();
      this.initSectionAccentTracking();
      this.onScroll();
      this.onResize();
    },

    cacheDom() {
      this.body = document.body;
      this.header = document.querySelector(".site-header");
      this.mobileNav = document.querySelector(".mobile-nav");
      this.menuToggle = document.querySelector(".menu-toggle");
      this.navLinks = document.querySelectorAll(
        '.main-nav a, .mobile-nav a, .header-link, .header-cta, .btn[href^="#"], .text-link[href^="#"], .footer-column a[href^="#"], .brand[href^="#"]'
      );

      this.heroSection = document.querySelector(".hero-section");
      this.heroTitle = document.querySelector(".hero-title");
      this.heroCopy = document.querySelector(".hero-copy");
      this.heroPanel = document.querySelector(".hero-panel");
      this.heroPanelFrame = document.querySelector(".hero-panel-frame");
      this.heroGlow1 = document.querySelector(".hero-glow-1");
      this.heroGlow2 = document.querySelector(".hero-glow-2");
      this.heroStrip = document.querySelector(".strip-track");

      this.metricCards = document.querySelectorAll(".metric-card");
      this.metricValues = document.querySelectorAll(".metric-value");

      this.revealElements = document.querySelectorAll(
        ".reveal-up, .service-card, .process-card, .capability-card, .testimonial-card, .faq-item, .comparison-card, .enterprise-card, .trust-band-card, .diagnostic-point, .final-cta-box"
      );

      this.glowCards = document.querySelectorAll(
        ".service-card, .capability-card, .testimonial-card, .comparison-card, .enterprise-card, .trust-band-card, .process-card, .diagnostic-point"
      );

      this.tiltCards = document.querySelectorAll(
        ".visual-card, .enterprise-panel, .final-cta-box"
      );

      this.faqItems = document.querySelectorAll(".faq-item");

      this.sections = document.querySelectorAll("main section[id], main section");
      this.mainNavAnchors = document.querySelectorAll(".main-nav a, .mobile-nav a");

      this.rafScroll = null;
      this.rafResize = null;
      this.lastKnownScrollY = window.scrollY;
      this.viewportHeight = window.innerHeight;
      this.viewportWidth = window.innerWidth;
      this.hasAnimatedCounters = false;

      this.stripAnimationFrame = null;
      this.stripResizeTimeout = null;
      this.stripX = 0;
      this.stripSpeed = 0.55;
      this.stripPaused = false;
      this.stripSingleWidth = 0;
      this.stripReady = false;
      this.lastFrameTime = 0;
    },

    bindEvents() {
      window.addEventListener(
        "scroll",
        () => {
          this.lastKnownScrollY = window.scrollY;

          if (!this.rafScroll) {
            this.rafScroll = window.requestAnimationFrame(() => {
              this.onScroll();
              this.rafScroll = null;
            });
          }
        },
        { passive: true }
      );

      window.addEventListener("resize", () => {
        if (!this.rafResize) {
          this.rafResize = window.requestAnimationFrame(() => {
            this.onResize();
            this.rafResize = null;
          });
        }
      });

      if (this.menuToggle) {
        this.menuToggle.addEventListener("click", () => {
          this.toggleMobileMenu();
        });
      }

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && this.body.classList.contains("menu-open")) {
          this.closeMobileMenu();
        }
      });

      document.addEventListener("click", (event) => {
        if (!this.body.classList.contains("menu-open")) return;
        if (!this.mobileNav || !this.menuToggle) return;

        const clickedInsideNav = this.mobileNav.contains(event.target);
        const clickedToggle = this.menuToggle.contains(event.target);

        if (!clickedInsideNav && !clickedToggle) {
          this.closeMobileMenu();
        }
      });
    },

    createScrollProgressBar() {
      const progress = document.createElement("div");
      progress.className = "scroll-progress";
      progress.setAttribute("aria-hidden", "true");

      const progressInner = document.createElement("div");
      progressInner.className = "scroll-progress-bar";

      progress.appendChild(progressInner);
      document.body.appendChild(progress);

      this.scrollProgress = progress;
      this.scrollProgressBar = progressInner;
    },

    initHeaderState() {
      if (!this.header) return;
      if (window.scrollY > 12) {
        this.header.classList.add("is-scrolled");
      }
    },

    onScroll() {
      this.updateHeaderOnScroll();
      this.updateScrollProgress();
      this.updateHeroParallaxFrame();
      this.updateActiveNavSection();
      this.checkCountersTrigger();
    },

    onResize() {
      this.viewportHeight = window.innerHeight;
      this.viewportWidth = window.innerWidth;

      if (this.viewportWidth > 980 && this.body.classList.contains("menu-open")) {
        this.closeMobileMenu();
      }

      if (this.heroStrip) {
        clearTimeout(this.stripResizeTimeout);
        this.stripResizeTimeout = setTimeout(() => {
          this.rebuildStripMarquee();
        }, 120);
      }
    },

    updateHeaderOnScroll() {
      if (!this.header) return;

      const scrollY = this.lastKnownScrollY;

      if (scrollY > 18) {
        this.header.classList.add("is-scrolled");
      } else {
        this.header.classList.remove("is-scrolled");
      }

      if (scrollY > 240) {
        this.header.classList.add("is-condensed");
      } else {
        this.header.classList.remove("is-condensed");
      }
    },

    updateScrollProgress() {
      if (!this.scrollProgressBar) return;

      const doc = document.documentElement;
      const scrollTop = window.scrollY || doc.scrollTop;
      const scrollHeight = doc.scrollHeight - doc.clientHeight;

      const progress = scrollHeight > 0 ? Math.min((scrollTop / scrollHeight) * 100, 100) : 0;
      this.scrollProgressBar.style.transform = `scaleX(${progress / 100})`;
    },

    initMobileMenu() {
      const mobileLinks = document.querySelectorAll(".mobile-nav a");

      mobileLinks.forEach((link) => {
        link.addEventListener("click", () => {
          this.closeMobileMenu();
        });
      });
    },

    toggleMobileMenu() {
      if (this.body.classList.contains("menu-open")) {
        this.closeMobileMenu();
      } else {
        this.openMobileMenu();
      }
    },

    openMobileMenu() {
      this.body.classList.add("menu-open");

      if (this.menuToggle) {
        this.menuToggle.classList.add("is-active");
        this.menuToggle.setAttribute("aria-expanded", "true");
      }

      if (this.mobileNav) {
        this.mobileNav.classList.add("is-open");
      }
    },

    closeMobileMenu() {
      this.body.classList.remove("menu-open");

      if (this.menuToggle) {
        this.menuToggle.classList.remove("is-active");
        this.menuToggle.setAttribute("aria-expanded", "false");
      }

      if (this.mobileNav) {
        this.mobileNav.classList.remove("is-open");
      }
    },

    initRevealSystem() {
      if (!("IntersectionObserver" in window)) {
        this.revealElements.forEach((element) => {
          element.classList.add("is-visible");
        });
        return;
      }

      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          });
        },
        {
          threshold: 0.16,
          rootMargin: "0px 0px -8% 0px",
        }
      );

      this.revealElements.forEach((element) => {
        revealObserver.observe(element);
      });
    },

    initSmoothAnchors() {
      this.navLinks.forEach((anchor) => {
        anchor.addEventListener("click", (event) => {
          const href = anchor.getAttribute("href");
          if (!href || !href.startsWith("#")) return;

          const target = document.querySelector(href);
          if (!target) return;

          event.preventDefault();

          const headerHeight = this.header ? this.header.offsetHeight : 0;
          const offset = 18;
          const targetTop =
            target.getBoundingClientRect().top + window.scrollY - headerHeight - offset;

          window.scrollTo({
            top: Math.max(targetTop, 0),
            behavior: "smooth",
          });
        });
      });
    },

    initHeroParallax() {
      if (!this.heroSection) return;

      this.heroSection.addEventListener(
        "mousemove",
        (event) => {
          if (this.viewportWidth < 980) return;

          const rect = this.heroSection.getBoundingClientRect();
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;

          if (this.heroGlow1) {
            const glowX = 35 + x * 10;
            const glowY = 18 + y * 8;
            this.heroGlow1.style.transform = `translate3d(${(x - 0.5) * 24}px, ${(y - 0.5) * 18}px, 0)`;
            this.heroGlow1.style.setProperty("--gx", `${glowX}%`);
            this.heroGlow1.style.setProperty("--gy", `${glowY}%`);
          }

          if (this.heroGlow2) {
            this.heroGlow2.style.transform = `translate3d(${(0.5 - x) * 32}px, ${(0.5 - y) * 24}px, 0)`;
          }

          if (this.heroPanelFrame) {
            const rotateY = (x - 0.5) * 4;
            const rotateX = (0.5 - y) * 3;
            this.heroPanelFrame.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
          }

          if (this.heroCopy) {
            this.heroCopy.style.transform = `translate3d(${(x - 0.5) * 8}px, ${(y - 0.5) * 6}px, 0)`;
          }
        },
        { passive: true }
      );

      this.heroSection.addEventListener(
        "mouseleave",
        () => {
          if (this.heroGlow1) {
            this.heroGlow1.style.transform = "";
          }

          if (this.heroGlow2) {
            this.heroGlow2.style.transform = "";
          }

          if (this.heroPanelFrame) {
            this.heroPanelFrame.style.transform = "";
          }

          if (this.heroCopy) {
            this.heroCopy.style.transform = "";
          }
        },
        { passive: true }
      );
    },

    updateHeroParallaxFrame() {
      if (!this.heroSection) return;

      const scrollY = this.lastKnownScrollY;
      const heroHeight = this.heroSection.offsetHeight || this.viewportHeight;
      const progress = Math.min(scrollY / heroHeight, 1);

      if (this.heroCopy) {
        const translateY = progress * 26;
        this.heroCopy.style.setProperty("--scroll-shift", `${translateY}px`);
      }

      if (this.heroPanel) {
        const translateY = progress * 38;
        this.heroPanel.style.setProperty("--scroll-shift", `${translateY}px`);
      }

      if (this.heroTitle) {
        const opacity = 1 - progress * 0.22;
        this.heroTitle.style.opacity = `${Math.max(opacity, 0.72)}`;
      }

      if (this.heroGlow1) {
        this.heroGlow1.style.opacity = `${Math.max(0.85 - progress * 0.25, 0.3)}`;
      }

      if (this.heroGlow2) {
        this.heroGlow2.style.opacity = `${Math.max(0.75 - progress * 0.2, 0.2)}`;
      }
    },

    initMetricCounters() {
      this.metricValues.forEach((node) => {
        const rawText = node.textContent.trim();
        let numericTarget = 0;
        let prefix = "";
        let suffix = "";

        if (rawText.includes("+")) {
          prefix = "+";
        }

        if (rawText.toLowerCase().includes("h")) {
          suffix = "h";
        }

        numericTarget = parseInt(rawText.replace(/[^\d]/g, ""), 10) || 0;

        node.dataset.target = String(numericTarget);
        node.dataset.prefix = prefix;
        node.dataset.suffix = suffix;
        node.dataset.original = rawText;
      });
    },

    checkCountersTrigger() {
      if (this.hasAnimatedCounters || !this.metricCards.length) return;

      const firstMetric = this.metricCards[0];
      const rect = firstMetric.getBoundingClientRect();

      if (rect.top < this.viewportHeight * 0.9) {
        this.hasAnimatedCounters = true;
        this.animateAllCounters();
      }
    },

    animateAllCounters() {
      this.metricValues.forEach((node, index) => {
        const target = parseInt(node.dataset.target || "0", 10);
        const prefix = node.dataset.prefix || "";
        const suffix = node.dataset.suffix || "";

        this.animateCounter(node, target, prefix, suffix, 1200 + index * 140);
      });
    },

    animateCounter(node, target, prefix = "", suffix = "", duration = 1400) {
      const start = 0;
      const startTime = performance.now();

      const formatValue = (value) => {
        if (target >= 1000) {
          return value.toLocaleString("en-US");
        }
        return String(value);
      };

      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

      const update = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);
        const current = Math.round(start + (target - start) * eased);

        node.textContent = `${prefix}${formatValue(current)}${suffix}`;

        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          node.textContent = `${prefix}${formatValue(target)}${suffix}`;
          node.classList.add("count-complete");
        }
      };

      requestAnimationFrame(update);
    },

    initGlowCards() {
      this.glowCards.forEach((card) => {
        card.addEventListener("mousemove", (event) => {
          if (this.viewportWidth < 768) return;

          const rect = card.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;

          card.style.setProperty("--mouse-x", `${x}px`);
          card.style.setProperty("--mouse-y", `${y}px`);

          const rotateX = ((y / rect.height) - 0.5) * -4;
          const rotateY = ((x / rect.width) - 0.5) * 5;

          card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
        });

        card.addEventListener("mouseleave", () => {
          card.style.transform = "";
        });
      });
    },

    initProcessAndFeatureTilt() {
      this.tiltCards.forEach((card) => {
        card.addEventListener("mousemove", (event) => {
          if (this.viewportWidth < 980) return;

          const rect = card.getBoundingClientRect();
          const px = (event.clientX - rect.left) / rect.width;
          const py = (event.clientY - rect.top) / rect.height;

          const rotateX = (0.5 - py) * 8;
          const rotateY = (px - 0.5) * 10;

          card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
        });

        card.addEventListener("mouseleave", () => {
          card.style.transform = "";
        });
      });
    },

    initFaqBehavior() {
      if (!this.faqItems.length) return;

      this.faqItems.forEach((item) => {
        item.addEventListener("toggle", () => {
          if (!item.open) return;

          this.faqItems.forEach((other) => {
            if (other !== item) {
              other.open = false;
            }
          });
        });
      });
    },

    initButtonFeedback() {
      const buttons = document.querySelectorAll(".btn, .header-cta, .cta, .text-link");

      buttons.forEach((button) => {
        button.addEventListener("mousemove", (event) => {
          const rect = button.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;

          button.style.setProperty("--btn-x", `${x}px`);
          button.style.setProperty("--btn-y", `${y}px`);
        });

        button.addEventListener("mousedown", () => {
          button.classList.add("is-pressed");
        });

        const release = () => button.classList.remove("is-pressed");

        button.addEventListener("mouseup", release);
        button.addEventListener("mouseleave", release);
      });
    },

    initStripMotion() {
      if (!this.heroStrip) return;

      this.rebuildStripMarquee();

      this.heroStrip.addEventListener("mouseenter", () => {
        this.stripPaused = true;
      });

      this.heroStrip.addEventListener("mouseleave", () => {
        this.stripPaused = false;
      });

      const loop = (time) => {
        if (!this.stripReady) {
          this.stripAnimationFrame = requestAnimationFrame(loop);
          return;
        }

        if (!this.lastFrameTime) {
          this.lastFrameTime = time;
        }

        const delta = time - this.lastFrameTime;
        this.lastFrameTime = time;

        if (!this.stripPaused) {
          const speedFactor = this.viewportWidth < 768 ? 0.38 : this.stripSpeed;
          this.stripX -= speedFactor * (delta / 16.6667);

          if (Math.abs(this.stripX) >= this.stripSingleWidth) {
            this.stripX += this.stripSingleWidth;
          }

          this.heroStrip.style.transform = `translate3d(${this.stripX}px, 0, 0)`;
        }

        this.stripAnimationFrame = requestAnimationFrame(loop);
      };

      this.stripAnimationFrame = requestAnimationFrame(loop);
    },

    rebuildStripMarquee() {
      if (!this.heroStrip) return;

      if (this.stripAnimationFrame) {
        cancelAnimationFrame(this.stripAnimationFrame);
        this.stripAnimationFrame = null;
      }

      this.lastFrameTime = 0;
      this.stripReady = false;
      this.stripX = 0;

      if (!this.heroStrip.dataset.baseMarkup) {
        this.heroStrip.dataset.baseMarkup = this.heroStrip.innerHTML;
      }

      const baseMarkup = this.heroStrip.dataset.baseMarkup;
      this.heroStrip.innerHTML = "";

      const measureBlock = document.createElement("div");
      measureBlock.className = "strip-block";
      measureBlock.style.display = "flex";
      measureBlock.style.alignItems = "center";
      measureBlock.style.gap = "16px";
      measureBlock.innerHTML = baseMarkup;
      this.heroStrip.appendChild(measureBlock);

      this.stripSingleWidth = measureBlock.scrollWidth;

      while (this.heroStrip.scrollWidth < window.innerWidth + this.stripSingleWidth * 2) {
        const clone = measureBlock.cloneNode(true);
        this.heroStrip.appendChild(clone);
      }

      this.stripReady = true;
      this.heroStrip.style.transform = "translate3d(0px, 0, 0)";

      const existingFrame = this.stripAnimationFrame;
      if (existingFrame) {
        cancelAnimationFrame(existingFrame);
      }

      this.lastFrameTime = 0;

      const loop = (time) => {
        if (!this.stripReady) {
          this.stripAnimationFrame = requestAnimationFrame(loop);
          return;
        }

        if (!this.lastFrameTime) {
          this.lastFrameTime = time;
        }

        const delta = time - this.lastFrameTime;
        this.lastFrameTime = time;

        if (!this.stripPaused) {
          const speedFactor = this.viewportWidth < 768 ? 0.38 : this.stripSpeed;
          this.stripX -= speedFactor * (delta / 16.6667);

          if (Math.abs(this.stripX) >= this.stripSingleWidth) {
            this.stripX += this.stripSingleWidth;
          }

          this.heroStrip.style.transform = `translate3d(${this.stripX}px, 0, 0)`;
        }

        this.stripAnimationFrame = requestAnimationFrame(loop);
      };

      this.stripAnimationFrame = requestAnimationFrame(loop);
    },

    initSectionAccentTracking() {
      if (!("IntersectionObserver" in window)) return;

      const sectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("section-active");
          });
        },
        {
          threshold: 0.24,
        }
      );

      this.sections.forEach((section) => {
        sectionObserver.observe(section);
      });
    },

    updateActiveNavSection() {
      if (!this.mainNavAnchors.length) return;

      let currentSectionId = "";

      const offset = (this.header ? this.header.offsetHeight : 0) + 60;

      document.querySelectorAll("section[id]").forEach((section) => {
        const top = section.offsetTop - offset;
        const bottom = top + section.offsetHeight;

        if (window.scrollY >= top && window.scrollY < bottom) {
          currentSectionId = section.getAttribute("id");
        }
      });

      this.mainNavAnchors.forEach((link) => {
        const href = link.getAttribute("href");
        if (!href || !href.startsWith("#")) return;

        if (href === `#${currentSectionId}`) {
          link.classList.add("is-active");
        } else {
          link.classList.remove("is-active");
        }
      });
    },
  };

  app.init();
});

/*
|--------------------------------------------------------------------------
| UTILIDAD EXTRA: pequeña mejora visual para details/summary
|--------------------------------------------------------------------------
| Hace que al abrir un FAQ el scroll sea un poco más amable si el item
| queda muy abajo en pantalla.
|--------------------------------------------------------------------------
*/
(() => {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;

      const rect = item.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const header = document.querySelector(".site-header");
      const headerHeight = header ? header.offsetHeight : 0;

      if (rect.top < headerHeight + 12) return;

      if (rect.bottom > viewportHeight - 60) {
        const top = rect.top + window.scrollY - headerHeight - 24;
        window.scrollTo({
          top,
          behavior: "smooth",
        });
      }
    });
  });
})();

/*
|--------------------------------------------------------------------------
| UTILIDAD EXTRA: estado inicial de soporte JS
|--------------------------------------------------------------------------
*/
document.documentElement.classList.add("js-ready");
