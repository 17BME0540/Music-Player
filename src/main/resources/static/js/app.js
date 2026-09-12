const API_BASE = "/api";
const TOKEN_KEY = "resonance_token";
const USERNAME_KEY = "resonance_username";

// ---------- Auth state ----------

function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function getUsername() {
    return localStorage.getItem(USERNAME_KEY);
}

function setSession(token, username) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USERNAME_KEY, username);
    renderAuthState();
}

function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    renderAuthState();
}

function isLoggedIn() {
    return !!getToken();
}

// ---------- API helpers ----------

function authHeaders(extra = {}) {
    const token = getToken();
    return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

async function apiGet(path) {
    const res = await fetch(API_BASE + path, { headers: authHeaders() });
    if (!res.ok) throw new Error("Request failed: " + path);
    return res.json();
}

async function apiJson(path, method, body) {
    const res = await fetch(API_BASE + path, {
        method,
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err?.message || "Request failed: " + path);
    }
    return res.status === 204 ? null : res.json();
}

async function apiDelete(path) {
    const res = await fetch(API_BASE + path, { method: "DELETE", headers: authHeaders() });
    if (!res.ok) throw new Error("Request failed: " + path);
}

async function safeJson(res) {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

// ---------- DOM refs ----------

const audioEl = document.getElementById("audio-el");
const playBtn = document.getElementById("play-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const seekBar = document.getElementById("seek-bar");
const volumeBar = document.getElementById("volume-bar");
const currentTimeEl = document.getElementById("current-time");
const durationTimeEl = document.getElementById("duration-time");
const nowPlayingTitle = document.getElementById("now-playing-title");
const nowPlayingArtist = document.getElementById("now-playing-artist");

const songListEl = document.getElementById("song-list");
const songCountPill = document.getElementById("song-count-pill");
const playlistListEl = document.getElementById("playlist-list");
const activePlaylistTitleEl = document.getElementById("active-playlist-title");
const activePlaylistSongsEl = document.getElementById("active-playlist-songs");

const libraryView = document.getElementById("library-view");
const playlistsView = document.getElementById("playlists-view");
const uploadView = document.getElementById("upload-view");
const navItems = document.querySelectorAll(".nav-item");

const uploadForm = document.getElementById("upload-form");
const uploadStatus = document.getElementById("upload-status");
const fileInput = document.getElementById("file-input");
const fileDropLabel = document.getElementById("file-drop-label");
const playlistForm = document.getElementById("playlist-form");
const searchInput = document.getElementById("search-input");
const searchClearBtn = document.getElementById("search-clear");

const authArea = document.getElementById("auth-area");
const userArea = document.getElementById("user-area");
const userAvatar = document.getElementById("user-avatar");
const userNameLabel = document.getElementById("user-name-label");
const loginOpenBtn = document.getElementById("login-open-btn");
const registerOpenBtn = document.getElementById("register-open-btn");
const logoutBtn = document.getElementById("logout-btn");

const authModal = document.getElementById("auth-modal");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalTitle = document.getElementById("modal-title");
const authForm = document.getElementById("auth-form");
const authUsername = document.getElementById("auth-username");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const authStatus = document.getElementById("auth-status");
const switchModeText = document.getElementById("switch-mode-text");
const switchModeLink = document.getElementById("switch-mode-link");

const aiToggleBtn = document.getElementById("ai-toggle-btn");
const aiPanel = document.getElementById("ai-panel");
const aiCloseBtn = document.getElementById("ai-close-btn");
const aiMessages = document.getElementById("ai-messages");
const aiForm = document.getElementById("ai-form");
const aiInput = document.getElementById("ai-input");

let allSongs = [];
let currentQueue = [];
let currentIndex = -1;
let authMode = "login"; // or "register"

// ---------- Rendering: auth ----------

function renderAuthState() {
    if (isLoggedIn()) {
        authArea.classList.add("hidden");
        userArea.classList.remove("hidden");
        const name = getUsername() || "?";
        userNameLabel.textContent = name;
        userAvatar.textContent = name.charAt(0);
    } else {
        authArea.classList.remove("hidden");
        userArea.classList.add("hidden");
    }
}

function openAuthModal(mode) {
    authMode = mode;
    authStatus.textContent = "";
    authForm.reset();
    if (mode === "login") {
        modalTitle.textContent = "Log in";
        authSubmitBtn.textContent = "Log in";
        authEmail.classList.add("hidden");
        switchModeText.textContent = "Don't have an account?";
        switchModeLink.textContent = "Sign up";
    } else {
        modalTitle.textContent = "Create your account";
        authSubmitBtn.textContent = "Sign up";
        authEmail.classList.remove("hidden");
        switchModeText.textContent = "Already have an account?";
        switchModeLink.textContent = "Log in";
    }
    authModal.classList.remove("hidden");
}

function closeAuthModal() {
    authModal.classList.add("hidden");
}

loginOpenBtn.addEventListener("click", () => openAuthModal("login"));
registerOpenBtn.addEventListener("click", () => openAuthModal("register"));
modalCloseBtn.addEventListener("click", closeAuthModal);
authModal.addEventListener("click", (e) => {
    if (e.target === authModal) closeAuthModal();
});
switchModeLink.addEventListener("click", (e) => {
    e.preventDefault();
    openAuthModal(authMode === "login" ? "register" : "login");
});

logoutBtn.addEventListener("click", () => {
    clearSession();
});

authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    authStatus.textContent = "Please wait...";
    const path = authMode === "login" ? "/auth/login" : "/auth/register";
    const body =
        authMode === "login"
            ? { username: authUsername.value, password: authPassword.value }
            : { username: authUsername.value, password: authPassword.value, email: authEmail.value };
    try {
        const result = await apiJson(path, "POST", body);
        setSession(result.token, result.username);
        authStatus.textContent = "";
        closeAuthModal();
    } catch (err) {
        authStatus.textContent = err.message || "Something went wrong.";
    }
});

// ---------- Navigation ----------

navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
        navItems.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const view = btn.dataset.view;
        libraryView.classList.toggle("hidden", view !== "library");
        playlistsView.classList.toggle("hidden", view !== "playlists");
        uploadView.classList.toggle("hidden", view !== "upload");
    });
});

// ---------- Rendering: tracks ----------

function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

function renderTrackRow(song, queueRef, index) {
    const li = document.createElement("li");
    li.className = "track-row";
    if (currentQueue === queueRef && currentIndex === index) {
        li.classList.add("playing");
    }

    const icon = document.createElement("div");
    icon.className = "track-icon";
    icon.textContent = "♪";

    const meta = document.createElement("div");
    meta.className = "track-meta";
    const title = document.createElement("span");
    title.className = "track-title-text";
    title.textContent = song.title || song.originalFileName || "Untitled";
    const sub = document.createElement("span");
    sub.className = "track-sub";
    sub.textContent = [song.artist, song.album].filter(Boolean).join(" · ") || "Unknown artist";
    meta.appendChild(title);
    meta.appendChild(sub);

    const actions = document.createElement("div");
    actions.className = "track-actions";

    const addBtn = document.createElement("button");
    addBtn.className = "btn-icon";
    addBtn.textContent = "+";
    addBtn.title = "Add to playlist";
    addBtn.onclick = (e) => {
        e.stopPropagation();
        promptAddToPlaylist(song.id);
    };
    actions.appendChild(addBtn);

    if (isLoggedIn()) {
        const delBtn = document.createElement("button");
        delBtn.className = "btn-icon";
        delBtn.textContent = "✕";
        delBtn.title = "Delete song";
        delBtn.onclick = async (e) => {
            e.stopPropagation();
            if (confirm(`Delete "${song.title}"?`)) {
                try {
                    await apiDelete(`/songs/${song.id}`);
                    await loadAllSongs();
                } catch (err) {
                    alert(err.message);
                }
            }
        };
        actions.appendChild(delBtn);
    }

    li.appendChild(icon);
    li.appendChild(meta);
    li.appendChild(actions);
    li.onclick = () => playFromQueue(queueRef, index);

    return li;
}

function renderSongList(container, songs) {
    container.innerHTML = "";
    songs.forEach((song, idx) => container.appendChild(renderTrackRow(song, songs, idx)));
}

function renderPlaylists(playlists) {
    playlistListEl.innerHTML = "";
    playlists.forEach((playlist) => {
        const li = document.createElement("li");
        const label = document.createElement("span");
        label.textContent = `${playlist.name} (${playlist.songs.length})`;
        li.appendChild(label);
        li.onclick = () => showPlaylist(playlist);

        if (isLoggedIn()) {
            const delBtn = document.createElement("button");
            delBtn.className = "btn-icon";
            delBtn.textContent = "✕";
            delBtn.onclick = async (e) => {
                e.stopPropagation();
                if (confirm(`Delete playlist "${playlist.name}"?`)) {
                    try {
                        await apiDelete(`/playlists/${playlist.id}`);
                        await loadPlaylists();
                    } catch (err) {
                        alert(err.message);
                    }
                }
            };
            li.appendChild(delBtn);
        }

        playlistListEl.appendChild(li);
    });
}

// ---------- Data loading ----------

async function loadAllSongs() {
    allSongs = await apiGet("/songs");
    songCountPill.textContent = `${allSongs.length} track${allSongs.length === 1 ? "" : "s"}`;
    renderSongList(songListEl, allSongs);
}

async function loadPlaylists() {
    const playlists = await apiGet("/playlists");
    renderPlaylists(playlists);
    return playlists;
}

function showPlaylist(playlist) {
    navItems.forEach((b) => b.classList.remove("active"));
    document.querySelector('.nav-item[data-view="playlists"]').classList.add("active");
    libraryView.classList.add("hidden");
    uploadView.classList.add("hidden");
    playlistsView.classList.remove("hidden");
    activePlaylistTitleEl.textContent = playlist.name;
    renderSongList(activePlaylistSongsEl, playlist.songs);
}

async function promptAddToPlaylist(songId) {
    const playlists = await apiGet("/playlists");
    if (playlists.length === 0) {
        alert("Create a playlist first using the sidebar form.");
        return;
    }
    const names = playlists.map((p, i) => `${i + 1}. ${p.name}`).join("\n");
    const choice = prompt(`Add to which playlist?\n${names}\n\nEnter a number:`);
    const idx = parseInt(choice, 10) - 1;
    if (isNaN(idx) || idx < 0 || idx >= playlists.length) return;
    try {
        await apiJson(`/playlists/${playlists[idx].id}/songs/${songId}`, "POST");
        await loadPlaylists();
    } catch (err) {
        alert(err.message);
    }
}

// ---------- Player ----------

function playFromQueue(queue, index) {
    currentQueue = queue;
    currentIndex = index;
    const song = queue[index];
    if (!song) return;

    audioEl.src = `${API_BASE}/songs/${song.id}/stream`;
    audioEl.play();
    nowPlayingTitle.textContent = song.title || "Untitled";
    nowPlayingArtist.textContent = song.artist || "";
    playBtn.innerHTML = "&#10074;&#10074;";

    renderSongList(songListEl, allSongs);
}

function togglePlayPause() {
    if (!audioEl.src) return;
    if (audioEl.paused) {
        audioEl.play();
        playBtn.innerHTML = "&#10074;&#10074;";
    } else {
        audioEl.pause();
        playBtn.innerHTML = "&#9658;";
    }
}

function playNext() {
    if (currentQueue.length === 0) return;
    playFromQueue(currentQueue, (currentIndex + 1) % currentQueue.length);
}

function playPrev() {
    if (currentQueue.length === 0) return;
    playFromQueue(currentQueue, (currentIndex - 1 + currentQueue.length) % currentQueue.length);
}

audioEl.addEventListener("timeupdate", () => {
    if (!isFinite(audioEl.duration)) return;
    seekBar.value = (audioEl.currentTime / audioEl.duration) * 100;
    currentTimeEl.textContent = formatTime(audioEl.currentTime);
    durationTimeEl.textContent = formatTime(audioEl.duration);
});

audioEl.addEventListener("ended", playNext);

seekBar.addEventListener("input", () => {
    if (!isFinite(audioEl.duration)) return;
    audioEl.currentTime = (seekBar.value / 100) * audioEl.duration;
});

volumeBar.addEventListener("input", () => {
    audioEl.volume = volumeBar.value;
});

playBtn.addEventListener("click", togglePlayPause);
nextBtn.addEventListener("click", playNext);
prevBtn.addEventListener("click", playPrev);

// ---------- Upload ----------

fileInput.addEventListener("change", () => {
    fileDropLabel.textContent = fileInput.files.length ? fileInput.files[0].name : "Click to choose an audio file";
});

uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) {
        uploadStatus.textContent = "Log in first to upload.";
        return;
    }
    if (!fileInput.files.length) return;

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("title", document.getElementById("title-input").value);
    formData.append("artist", document.getElementById("artist-input").value);
    formData.append("album", document.getElementById("album-input").value);
    formData.append("genre", document.getElementById("genre-input").value);

    uploadStatus.textContent = "Uploading...";
    try {
        const res = await fetch(API_BASE + "/songs/upload", {
            method: "POST",
            headers: authHeaders(),
            body: formData,
        });
        if (!res.ok) throw new Error((await safeJson(res))?.message || "Upload failed");
        uploadStatus.textContent = "Uploaded!";
        uploadForm.reset();
        fileDropLabel.textContent = "Click to choose an audio file";
        await loadAllSongs();
    } catch (err) {
        uploadStatus.textContent = err.message;
    }
});

// ---------- Playlists ----------

playlistForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) {
        alert("Log in first to create playlists.");
        return;
    }
    const nameInput = document.getElementById("playlist-name-input");
    const name = nameInput.value.trim();
    if (!name) return;
    try {
        await apiJson("/playlists", "POST", { name });
        nameInput.value = "";
        await loadPlaylists();
    } catch (err) {
        alert(err.message);
    }
});

// ---------- Search ----------

searchInput.addEventListener("input", async () => {
    const q = searchInput.value.trim();
    searchClearBtn.classList.toggle("hidden", !q);
    if (!q) {
        renderSongList(songListEl, allSongs);
        return;
    }
    const results = await apiGet(`/songs/search?q=${encodeURIComponent(q)}`);
    renderSongList(songListEl, results);
});

searchClearBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchClearBtn.classList.add("hidden");
    renderSongList(songListEl, allSongs);
});

// ---------- AI DJ panel ----------

aiToggleBtn.addEventListener("click", () => {
    aiPanel.classList.toggle("hidden");
});
aiCloseBtn.addEventListener("click", () => aiPanel.classList.add("hidden"));

function appendAiMessage(text, isUser, matchedSongs) {
    const div = document.createElement("div");
    div.className = "ai-message" + (isUser ? " user" : "");
    div.textContent = text;

    if (matchedSongs && matchedSongs.length) {
        matchedSongs.forEach((song) => {
            const trackLine = document.createElement("div");
            trackLine.className = "ai-track";
            trackLine.textContent = `▶ ${song.title} — ${song.artist || "Unknown"}`;
            trackLine.onclick = () => playFromQueue(matchedSongs, matchedSongs.indexOf(song));
            div.appendChild(trackLine);
        });
    }

    aiMessages.appendChild(div);
    aiMessages.scrollTop = aiMessages.scrollHeight;
}

aiForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = aiInput.value.trim();
    if (!message) return;

    if (!isLoggedIn()) {
        appendAiMessage("Log in to chat with the AI DJ.", false);
        return;
    }

    appendAiMessage(message, true);
    aiInput.value = "";

    try {
        const result = await apiJson("/ai/chat", "POST", { message });
        appendAiMessage(result.reply || "Here's what I found:", false, result.songs);
    } catch (err) {
        appendAiMessage(err.message || "The AI DJ is unavailable right now.", false);
    }
});

// ---------- Init ----------

(async function init() {
    renderAuthState();
    await loadAllSongs();
    await loadPlaylists();
})();
