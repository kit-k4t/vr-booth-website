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
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
revealElements.forEach(el => revealObserver.observe(el));

function playInline(videoId, placeholder) {
    const video = document.getElementById(videoId);
    if (video) {
        document.querySelectorAll('video').forEach(otherVideo => {
            if (otherVideo !== video) otherVideo.pause();
        });
        placeholder.classList.add('hidden');
        video.setAttribute('controls', 'true');
        video.currentTime = 0;
        if (video.requestFullscreen) video.requestFullscreen();
        else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
        else if (video.msRequestFullscreen) video.msRequestFullscreen();
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
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        const observer = new ResizeObserver(() => updateNavPosition());
        observer.observe(announcement);
    }
});
window.addEventListener('resize', updateNavPosition);

function setLeaderboardLabels() {
    document.querySelectorAll('.leaderboard-table').forEach(table => {
        const ths = [...table.querySelectorAll('thead th')];
        table.querySelectorAll('tbody tr').forEach(tr => {
            tr.querySelectorAll('td').forEach((td, i) => {
                if (!ths[i]) return;
                td.setAttribute('data-label', ths[i].textContent.trim());
                if (!td.querySelector('.rank-badge') && !td.querySelector('.val')) {
                    const span = document.createElement('span');
                    span.className = 'val';
                    while (td.firstChild) span.appendChild(td.firstChild);
                    td.appendChild(span);
                }
            });
        });
    });
}
setLeaderboardLabels();

const LONG_GAMES = [
    "FNAF Sister Location VR",
    "FNAF Ultimate Custom Night VR",
    "Propagation VR"
];

const LS_KEY = 'vr_booth_queue';

function loadQueue() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || []; } catch { return []; }
}
function saveQueue(q) { localStorage.setItem(LS_KEY, JSON.stringify(q)); }

function renderQueue() {
    const q = loadQueue();
    const npEl = document.getElementById('npName');
    const listEl = document.getElementById('queueList');
    const emptyEl = document.getElementById('queueEmpty');
    const countEl = document.getElementById('queueCount');

    if (q.length === 0) {
        npEl.textContent = 'Nobody yet';
        listEl.innerHTML = '';
        emptyEl.style.display = 'block';
        countEl.textContent = '0 waiting';
        return;
    }

    const now = q[0];
    npEl.textContent = `${now.name} — ${now.game} (${now.passLabel})`;

    listEl.innerHTML = '';
    q.slice(1).forEach((item, idx) => {
        const li = document.createElement('li');
        li.className = 'queue-item';
        li.innerHTML = `
            <span class="queue-num">${idx + 1}</span>
            <div class="queue-info">
                <div class="queue-name">${escapeHtml(item.name)}</div>
                <div class="queue-meta">${escapeHtml(item.game)} &bull; ${escapeHtml(item.passLabel)}</div>
            </div>
            <button class="queue-remove" data-id="${item.id}" title="Remove">&times;</button>
        `;
        listEl.appendChild(li);
    });

    emptyEl.style.display = 'none';
    countEl.textContent = `${q.length - 1} waiting`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function addToQueue(name, game, pass) {
    const q = loadQueue();
    const passLabel = pass === '30min' ? '30 Min' : pass === '1hour' ? '1 Hour' : 'Rounds';
    q.push({ id: Date.now() + Math.random(), name, game, pass, passLabel });
    saveQueue(q);
    renderQueue();
}

function removeFromQueue(id) {
    let q = loadQueue();
    q = q.filter(item => item.id != id);
    saveQueue(q);
    renderQueue();
}

function completeAndCallNext() {
    let q = loadQueue();
    if (q.length === 0) return;
    q.shift();
    saveQueue(q);
    renderQueue();
}

const queueForm = document.getElementById('queueForm');
const passSelect = document.getElementById('queuePass');
const gameSelect = document.getElementById('queueGame');
const passHint = document.getElementById('passHint');

function checkPassGame() {
    const pass = passSelect.value;
    const game = gameSelect.value;
    const isLong = LONG_GAMES.includes(game);
    if (isLong && pass === 'rounds') {
        passHint.textContent = 'This game requires a 30 Min or 1 Hour pass.';
        return false;
    } else {
        passHint.textContent = '';
        return true;
    }
}

if (passSelect && gameSelect) {
    passSelect.addEventListener('change', checkPassGame);
    gameSelect.addEventListener('change', checkPassGame);
}

if (queueForm) {
    queueForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!checkPassGame()) return;
        const name = document.getElementById('queueName').value.trim();
        const game = gameSelect.value;
        const pass = passSelect.value;
        if (!name) return;
        addToQueue(name, game, pass);
        queueForm.reset();
        checkPassGame();
    });
}

document.getElementById('completeBtn')?.addEventListener('click', completeAndCallNext);

document.getElementById('queueList')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('queue-remove')) {
        removeFromQueue(e.target.dataset.id);
    }
});

renderQueue();
