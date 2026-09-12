const API_BASE = "/api";

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
const songListTitleEl = document.getElementById("song-list-title");
const playlistListEl = document.getElementById("playlist-list");
const activePlaylistSection = document.getElementById("active-playlist-section");
const activePlaylistTitleEl = document.getElementById("active-playlist-title");
const activePlaylistSongsEl = document.getElementById("active-playlist-songs");

const uploadForm = document.getElementById("upload-form");
const uploadStatus = document.getElementById("upload-status");
const playlistForm = document.getElementById("playlist-form");
const searchInput = document.getElementById("search-input");
const searchClearBtn = document.getElementById("search-clear");

let allSongs = [];
let currentQueue = [];
let currentIndex = -1;
let currentPlaylistId = null;

// ---------- API helpers ----------

async function apiGet(path) {
    const res = await fetch(API_BASE + path);
    if (!res.ok) throw new Error("Request failed: " + path);
    return res.json();
}

async function apiJson(path, method, body) {
    const res = await fetch(API_BASE + path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error("Request failed: " + path);
    return res.status === 204 ? null : res.json();
}

async function apiDelete(path) {
    const res = await fetch(API_BASE + path, { method: "DELETE" });
    if (!res.ok) throw new Error("Request failed: " + path);
}

// ---------- Rendering ----------

function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60)
        .toString()
        .padStart(2, "0");
    return `${m}:${s}`;
}

function renderSongRow(song, queueRef, index) {
    const li = document.createElement("li");

    const meta = document.createElement("div");
    meta.className = "song-meta";
    const title = document.createElement("span");
    title.className = "song-title";
    title.textContent = song.title || song.originalFileName || "Untitled";
    const sub = document.createElement("span");
    sub.className = "song-sub";
    sub.textContent = [song.artist, song.album].filter(Boolean).join(" · ");
    meta.appendChild(title);
    meta.appendChild(sub);

    const actions = document.createElement("div");
    actions.className = "song-actions";

    const addBtn = document.createElement("button");
    addBtn.textContent = "+";
    addBtn.title = "Add to playlist";
    addBtn.onclick = (e) => {
        e.stopPropagation();
        promptAddToPlaylist(song.id);
    };

    const delBtn = document.createElement("button");
    delBtn.textContent = "✕";
    delBtn.title = "Delete song";
    delBtn.onclick = async (e) => {
        e.stopPropagation();
        if (confirm(`Delete "${song.title}"?`)) {
            await apiDelete(`/songs/${song.id}`);
            await loadAllSongs();
        }
    };

    actions.appendChild(addBtn);
    actions.appendChild(delBtn);

    li.appendChild(meta);
    li.appendChild(actions);

    li.onclick = () => playFromQueue(queueRef, index);

    return li;
}

function renderSongList(container, songs) {
    container.innerHTML = "";
    songs.forEach((song, idx) => container.appendChild(renderSongRow(song, songs, idx)));
}

function renderPlaylists(playlists) {
    playlistListEl.innerHTML = "";

    const allLi = document.createElement("li");
    allLi.textContent = "All Songs";
    allLi.className = currentPlaylistId === null ? "active" : "";
    allLi.onclick = () => showAllSongs();
    playlistListEl.appendChild(allLi);

    playlists.forEach((playlist) => {
        const li = document.createElement("li");
        li.textContent = `${playlist.name} (${playlist.songs.length})`;
        li.className = currentPlaylistId === playlist.id ? "active" : "";
        li.onclick = () => showPlaylist(playlist);

        const delBtn = document.createElement("button");
        delBtn.textContent = "✕";
        delBtn.title = "Delete playlist";
        delBtn.onclick = async (e) => {
            e.stopPropagation();
            if (confirm(`Delete playlist "${playlist.name}"?`)) {
                await apiDelete(`/playlists/${playlist.id}`);
                await loadPlaylists();
                showAllSongs();
            }
        };
        li.appendChild(delBtn);

        playlistListEl.appendChild(li);
    });
}

// ---------- Data loading ----------

async function loadAllSongs() {
    allSongs = await apiGet("/songs");
    if (currentPlaylistId === null) {
        renderSongList(songListEl, allSongs);
    }
}

async function loadPlaylists() {
    const playlists = await apiGet("/playlists");
    renderPlaylists(playlists);
    return playlists;
}

function showAllSongs() {
    currentPlaylistId = null;
    songListTitleEl.textContent = "All Songs";
    activePlaylistSection.classList.add("hidden");
    renderSongList(songListEl, allSongs);
    loadPlaylists();
}

function showPlaylist(playlist) {
    currentPlaylistId = playlist.id;
    activePlaylistSection.classList.remove("hidden");
    activePlaylistTitleEl.textContent = playlist.name;
    renderSongList(activePlaylistSongsEl, playlist.songs);
    songListTitleEl.textContent = "All Songs";
    renderSongList(songListEl, allSongs);
    loadPlaylists();
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
    await apiJson(`/playlists/${playlists[idx].id}/songs/${songId}`, "POST");
    await loadPlaylists();
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
    const next = (currentIndex + 1) % currentQueue.length;
    playFromQueue(currentQueue, next);
}

function playPrev() {
    if (currentQueue.length === 0) return;
    const prev = (currentIndex - 1 + currentQueue.length) % currentQueue.length;
    playFromQueue(currentQueue, prev);
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

// ---------- Forms ----------

uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById("file-input");
    if (!fileInput.files.length) return;

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);
    formData.append("title", document.getElementById("title-input").value);
    formData.append("artist", document.getElementById("artist-input").value);
    formData.append("album", document.getElementById("album-input").value);
    formData.append("genre", document.getElementById("genre-input").value);

    uploadStatus.textContent = "Uploading...";
    try {
        const res = await fetch(API_BASE + "/songs/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        uploadStatus.textContent = "Uploaded!";
        uploadForm.reset();
        await loadAllSongs();
    } catch (err) {
        uploadStatus.textContent = "Upload failed.";
        console.error(err);
    }
});

playlistForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById("playlist-name-input");
    const name = nameInput.value.trim();
    if (!name) return;
    await apiJson("/playlists", "POST", { name });
    nameInput.value = "";
    await loadPlaylists();
});

searchInput.addEventListener("input", async () => {
    const q = searchInput.value.trim();
    if (!q) {
        renderSongList(songListEl, allSongs);
        return;
    }
    const results = await apiGet(`/songs/search?q=${encodeURIComponent(q)}`);
    renderSongList(songListEl, results);
});

searchClearBtn.addEventListener("click", () => {
    searchInput.value = "";
    renderSongList(songListEl, allSongs);
});

// ---------- Init ----------

(async function init() {
    await loadAllSongs();
    await loadPlaylists();
})();
