function toggleMenu() {
    document.getElementById('navLinks').classList.toggle('active');
}

document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        document.getElementById('navLinks').classList.remove('active');
    });
});

const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

revealElements.forEach(el => revealObserver.observe(el));

function playInline(videoId, placeholder) {
    const video = document.getElementById(videoId);

    if (video) {
        document.querySelectorAll('video').forEach(otherVideo => {
            if (otherVideo !== video) {
                otherVideo.pause();
            }
        });

        placeholder.classList.add('hidden');
        video.setAttribute('controls', 'true');

        video.currentTime = 0;

        if (video.requestFullscreen) {
            video.requestFullscreen();
        } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen();
        } else if (video.msRequestFullscreen) {
            video.msRequestFullscreen();
        }

        video.play().catch(err => console.log("Play error:", err));
    }
}

window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.scrollY > 50) {
        nav.style.background = 'rgba(10, 10, 15, 0.95)';
    } else {
        nav.style.background = 'rgba(10, 10, 15, 0.8)';
    }
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

function updateNavPosition() {
    const announcement = document.querySelector('.announcement-bar');
    const nav = document.querySelector('nav');

    if (announcement && nav) {
        nav.style.top = `${announcement.getBoundingClientRect().height}px`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const announcement = document.querySelector('.announcement-bar');

    if (announcement) {
        updateNavPosition();

        const observer = new ResizeObserver(() => {
            updateNavPosition();
        });

        observer.observe(announcement);
    }
});

window.addEventListener('resize', updateNavPosition);
