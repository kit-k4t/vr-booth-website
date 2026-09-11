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

        const observer = new ResizeObserver(() => updateNavPosition());
        observer.observe(announcement);
    }
});

function setLeaderboardLabels() {
    document.querySelectorAll('.leaderboard-table').forEach(table => {
        const ths = [...table.querySelectorAll('thead th')];

        table.querySelectorAll('tbody tr').forEach(tr => {
            tr.querySelectorAll('td').forEach((td, i) => {
                if (!ths[i]) return;

                td.setAttribute(
                    'data-label',
                    ths[i].textContent.trim()
                );

                if (
                    !td.querySelector('.rank-badge') &&
                    !td.querySelector('.val')
                ) {
                    const span = document.createElement('span');
                    span.className = 'val';

                    while (td.firstChild) {
                        span.appendChild(td.firstChild);
                    }

                    td.appendChild(span);
                }
            });
        });
    });
}

setLeaderboardLabels();

let supabaseClient = null;

try {
    supabaseClient = window.supabase.createClient(
        'https://nbryhdguniflsntyobac.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5icnloZGd1bmlmbHNudHlvYmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NzczOTksImV4cCI6MjEwNDU1MzM5OX0.5nhTK57SAvizDCgCOO1JEAk04CUR3bxIr-50UolRf-U'
    );
} catch (err) {
    console.error('Supabase failed to initialize:', err);
}

const LONG_GAMES = [
    "FNAF Sister Location VR",
    "Until You Fall",
    "Propagation VR"
];

let queueCache = [];


async function refreshQueue() {
    if (!supabaseClient) return;

    const { data, error } = await supabaseClient
        .from('queue')
        .select('*')
        .order('created_at', { ascending: true })
        .order('id', { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    queueCache = data || [];
    renderQueue();
}

if (supabaseClient) {
    supabaseClient
        .channel('queue-live')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'queue'
            },
            refreshQueue
        )
        .subscribe();
}

function renderQueue() {
    const q = queueCache;

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

    npEl.textContent =
        `${now.name} — ${now.game} (${now.pass_label})`;

    listEl.innerHTML = '';

    q.slice(1).forEach((item, idx) => {
        const li = document.createElement('li');

        li.className = 'queue-item';

        li.innerHTML = `
            <span class="queue-num">${idx + 1}</span>

            <div class="queue-info">
                <div class="queue-name">
                    ${escapeHtml(item.name)}
                </div>

                <div class="queue-meta">
                    ${escapeHtml(item.game)} &bull; ${escapeHtml(item.pass_label)}
                </div>
            </div>

            <button
                class="queue-remove staff-only"
                data-id="${item.id}"
                title="Remove"
            >
                &times;
            </button>
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


async function addToQueue(name, game, pass) {
    if (!supabaseClient) return;

    const pass_label =
        pass === '1round-special'
            ? '1 round \u2014 special'
            : pass === '30min'
                ? '30 min'
                : pass === '1hour'
                    ? '1 Hour'
                    : pass === 'rounds-20'
                        ? 'Rounds (20)'
                        : pass === 'rounds-50'
                            ? 'Rounds (50)'
                            : 'Rounds (75)';

    const { error } = await supabaseClient
        .from('queue')
        .insert({
            name,
            game,
            pass,
            pass_label
        });

    if (error) {
        console.error(error);
    }
}

async function removeFromQueue(id) {
    if (!supabaseClient) return;

    await supabaseClient
        .from('queue')
        .delete()
        .eq('id', id);
}


async function completeAndCallNext() {
    if (!supabaseClient || queueCache.length === 0) return;

    await supabaseClient
        .from('queue')
        .delete()
        .eq('id', queueCache[0].id);
}

const staffBtn = document.getElementById('staffBtn');
const staffLogin = document.getElementById('staffLogin');
const staffLogout = document.getElementById('staffLogout');


staffBtn?.addEventListener('click', () => {
    staffLogin.style.display =
        staffLogin.style.display === 'none'
            ? 'flex'
            : 'none';
});


document.getElementById('staffLoginBtn')?.addEventListener(
    'click',
    async () => {
        if (!supabaseClient) return;

        const email =
            document.getElementById('staffEmail').value.trim();

        const password =
            document.getElementById('staffPassword').value;

        const { error } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });

        if (error) {
            alert('Login failed: ' + error.message);
        }
    }
);


staffLogout?.addEventListener('click', async () => {
    if (!supabaseClient) return;

    await supabaseClient.auth.signOut();
});


if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(
        (event, session) => {
            const isStaff = !!session;

            document.body.classList.toggle(
                'staff',
                isStaff
            );

            if (staffBtn) {
                staffBtn.style.display =
                    isStaff ? 'none' : '';
            }

            if (staffLogout) {
                staffLogout.style.display =
                    isStaff ? '' : 'none';
            }

            if (isStaff && staffLogin) {
                staffLogin.style.display = 'none';
            }
        }
    );
}


document.getElementById('completeBtn')
    ?.addEventListener(
        'click',
        completeAndCallNext
    );

const queueForm = document.getElementById('queueForm');
const passSelect = document.getElementById('queuePass');
const gameSelect = document.getElementById('queueGame');
const passHint = document.getElementById('passHint');

function checkPassGame() {
    const isLong =
        LONG_GAMES.includes(gameSelect.value);

    if (
        isLong &&
        passSelect.value === 'rounds'
    ) {
        passHint.textContent =
            'This game requires a special or timed pass.';

        return false;
    }

    passHint.textContent = '';
    return true;
}

if (passSelect && gameSelect) {
    passSelect.addEventListener(
        'change',
        checkPassGame
    );

    gameSelect.addEventListener(
        'change',
        checkPassGame
    );
}

if (queueForm) {
    queueForm.addEventListener(
        'submit',
        async (e) => {
            e.preventDefault();

            if (!checkPassGame()) return;

            const name =
                document
                    .getElementById('queueName')
                    .value
                    .trim();

            if (!name) return;

            await addToQueue(
                name,
                gameSelect.value,
                passSelect.value
            );

            queueForm.reset();
            checkPassGame();
        }
    );
}

document.getElementById('queueList')
    ?.addEventListener('click', (e) => {
        const btn =
            e.target.closest('.queue-remove');

        if (btn) {
            removeFromQueue(btn.dataset.id);
        }
    });


refreshQueue();
