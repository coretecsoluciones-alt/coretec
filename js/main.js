/* CORETEC — Main JS */

(function () {
    'use strict';

    /* ── Header scroll state ── */
    const header = document.getElementById('header');

    function updateHeader() {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();

    /* ── Scroll cue fade ── */
    const scrollCue = document.querySelector('.hero-scroll-cue');
    if (scrollCue) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 80) {
                scrollCue.classList.add('hidden');
            } else {
                scrollCue.classList.remove('hidden');
            }
        }, { passive: true });
    }

    /* ── Scroll reveal (IntersectionObserver) ── */
    const revealEls = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    io.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        revealEls.forEach(el => io.observe(el));
    } else {
        // Fallback: just show everything
        revealEls.forEach(el => el.classList.add('visible'));
    }

    /* ── Mobile menu ── */
    const navToggle  = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');

    if (navToggle && mobileMenu) {
        navToggle.addEventListener('click', () => {
            const isOpen = mobileMenu.classList.toggle('open');
            navToggle.classList.toggle('open', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        // Close on link click
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                navToggle.classList.remove('open');
                document.body.style.overflow = '';
            });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!header.contains(e.target) && mobileMenu.classList.contains('open')) {
                mobileMenu.classList.remove('open');
                navToggle.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
    }

    /* ── Smooth scroll for anchor links ── */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(anchor.getAttribute('href'));
            if (!target) return;
            e.preventDefault();
            const offset = 70; // header height buffer
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    /* ── Hero parallax (subtle) ── */
    const heroVisual = document.querySelector('.hero-visual');
    const heroText   = document.querySelector('.hero-text');

    if (heroVisual && heroText) {
        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const y = window.scrollY;
                    if (y < window.innerHeight) {
                        heroVisual.style.transform = `translateY(${y * 0.12}px)`;
                        heroText.style.transform   = `translateY(${y * 0.06}px)`;
                    }
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    /* ── Card hover tilt (subtle 3D on desktop) ── */
    if (window.matchMedia('(hover: hover)').matches) {
        document.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect  = card.getBoundingClientRect();
                const cx    = rect.left + rect.width  / 2;
                const cy    = rect.top  + rect.height / 2;
                const dx    = (e.clientX - cx) / (rect.width  / 2);
                const dy    = (e.clientY - cy) / (rect.height / 2);
                card.style.transform = `translateY(-6px) rotateY(${dx * 3}deg) rotateX(${-dy * 3}deg)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.35s';
            });

            card.addEventListener('mouseenter', () => {
                card.style.transition = 'transform 0.1s, box-shadow 0.35s';
            });
        });
    }

    /* ── WhatsApp float: show after scroll ── */
    const waFloat = document.getElementById('waFloat');
    if (waFloat) {
        waFloat.style.opacity = '0';
        waFloat.style.transform = 'scale(0.8) translateY(12px)';
        waFloat.style.transition = 'opacity 0.4s, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';

        const showFloat = () => {
            if (window.scrollY > 300) {
                waFloat.style.opacity = '1';
                waFloat.style.transform = 'scale(1) translateY(0)';
            } else {
                waFloat.style.opacity = '0';
                waFloat.style.transform = 'scale(0.8) translateY(12px)';
            }
        };
        window.addEventListener('scroll', showFloat, { passive: true });
        showFloat();
    }

    /* ── Product section nav highlight ── */
    const sections = document.querySelectorAll('.product-section[id], .social-section[id]');
    const navLinks  = document.querySelectorAll('.nav-links a');

    if (sections.length && navLinks.length) {
        const sectionIo = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navLinks.forEach(link => {
                        link.classList.toggle(
                            'nav-active',
                            link.getAttribute('href') === `#${entry.target.id}`
                        );
                    });
                }
            });
        }, { threshold: 0.4 });

        sections.forEach(s => sectionIo.observe(s));
    }

    /* ── Ambient orb mouse tracking on hero ── */
    const heroAmbient = document.querySelector('.hero-ambient');
    if (heroAmbient) {
        document.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth)  * 10 - 5;
            const y = (e.clientY / window.innerHeight)  * 10 - 5;
            heroAmbient.style.transform = `translate(${x}px, ${y}px)`;
        }, { passive: true });
    }

    /* ── Product image sliders ── */
    function initSliders() {
        document.querySelectorAll('[data-slider]').forEach(container => {
            const track  = container.querySelector('.slider-track');
            const slides = container.querySelectorAll('.slide');
            if (!track || slides.length < 2) return;

            let current   = 0;
            let startX    = 0;
            let isDragging = false;

            // Create controls
            const dotsWrap = document.createElement('div');
            dotsWrap.className = 'slider-dots';

            const prevBtn = document.createElement('button');
            prevBtn.className = 'slider-arrow prev';
            prevBtn.setAttribute('aria-label', 'Anterior');
            prevBtn.innerHTML = '&#8249;';

            const nextBtn = document.createElement('button');
            nextBtn.className = 'slider-arrow next';
            nextBtn.setAttribute('aria-label', 'Siguiente');
            nextBtn.innerHTML = '&#8250;';

            const dots = Array.from(slides).map((_, i) => {
                const dot = document.createElement('button');
                dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
                dot.setAttribute('aria-label', `Imagen ${i + 1}`);
                dot.addEventListener('click', (e) => { e.stopPropagation(); goTo(i); });
                dotsWrap.appendChild(dot);
                return dot;
            });

            container.appendChild(dotsWrap);
            container.appendChild(prevBtn);
            container.appendChild(nextBtn);

            function goTo(index) {
                current = (index + slides.length) % slides.length;
                track.style.transform = `translateX(-${current * 100}%)`;
                dots.forEach((d, i) => d.classList.toggle('active', i === current));
                // Load image if it was deferred with data-src
                const lazyImg = slides[current].querySelector('img[data-src]');
                if (lazyImg) {
                    lazyImg.src = lazyImg.dataset.src;
                    lazyImg.removeAttribute('data-src');
                }
            }

            prevBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(current - 1); });
            nextBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(current + 1); });

            // Touch / drag support
            container.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
            }, { passive: true });

            container.addEventListener('touchend', (e) => {
                const dx = e.changedTouches[0].clientX - startX;
                if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
            }, { passive: true });

            // Mouse drag support
            container.addEventListener('mousedown', (e) => {
                startX    = e.clientX;
                isDragging = true;
            });

            container.addEventListener('mouseup', (e) => {
                if (!isDragging) return;
                isDragging = false;
                const dx = e.clientX - startX;
                if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
            });

            container.addEventListener('mouseleave', () => { isDragging = false; });
        });
    }

    initSliders();

    /* ── Video autoplay: reliable on iOS Safari + all modern browsers ── */
    function activateVideo(video) {
        if (video._activated) return;
        video._activated = true;
        // Lazy videos: set src directly on <video> (more reliable than <source> on iOS)
        const lazySrc = video.querySelector('source[data-src]');
        if (lazySrc) {
            video.src = lazySrc.dataset.src;
            lazySrc.removeAttribute('data-src');
        }
        // Muted videos can play without user gesture on iOS 10+ and all modern browsers
        video.play().catch(() => {});
    }

    function watchAndPlay(video, threshold) {
        if (!('IntersectionObserver' in window)) { activateVideo(video); return; }
        const io = new IntersectionObserver(entries => {
            if (!entries[0].isIntersecting) return;
            activateVideo(video);
            io.unobserve(video);
        }, { threshold: threshold || 0.1 });
        io.observe(video);
    }

    // iPhone hero — has src already, observer triggers play() when visible
    const iphoneHeroVideo = document.querySelector('.iphone-hero-video');
    if (iphoneHeroVideo) watchAndPlay(iphoneHeroVideo, 0.05);

    // Apple Watch (lazy src)
    const watchVideo = document.querySelector('[data-watch-video]');
    if (watchVideo) watchAndPlay(watchVideo, 0.15);

    // AirTag + Apple Pencil (lazy src)
    document.querySelectorAll('[data-lazy-video]').forEach(v => watchAndPlay(v, 0.1));

})();
