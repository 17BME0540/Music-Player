# Music Player — Spring Boot Full Stack App

A self-contained full stack music player: a Spring Boot REST API backend
(song/playlist management, file upload, range-request audio streaming) and
a vanilla HTML/CSS/JS frontend served straight from the same app.

## Features

- Upload audio files (mp3, wav, etc.) with metadata (title, artist, album, genre)
- Browse/search all songs (by title, artist, or album)
- Create, update, and delete playlists
- Add/remove songs from playlists
- Stream audio with HTTP range-request support (seekable HTML5 `<audio>` player)
- Play / pause / next / previous / seek / volume controls in the UI
- H2 file-based database — no external DB setup required

## Tech Stack

- **Backend:** Java 17, Spring Boot 3.3, Spring Data JPA, H2
- **Frontend:** HTML, CSS, vanilla JavaScript (served as Spring Boot static resources)

## Project Structure

```
music-player-spring-boot/
├── pom.xml
├── src/main/java/com/musicplayer/
│   ├── MusicPlayerApplication.java
│   ├── config/          # CORS + upload-dir configuration
│   ├── entity/          # Song, Playlist JPA entities
│   ├── repository/      # Spring Data repositories
│   ├── service/         # Business logic + file storage
│   ├── controller/      # REST controllers
│   ├── exception/       # Custom exceptions + global handler
│   └── dto/             # Request DTOs
├── src/main/resources/
│   ├── application.properties
│   └── static/          # index.html, css/, js/  (the frontend)
└── uploads/             # uploaded audio files land here at runtime
```

## Running Locally

Requires Java 17+ and Maven (or use an IDE with the Maven wrapper).

```bash
mvn spring-boot:run
```

Then open **http://localhost:8080** in your browser.

> Note: this environment could not run `mvn` to verify a full build (no
> outbound access to Maven Central from the sandbox this was built in), so
> compile it once locally after cloning to confirm everything resolves —
> the code follows standard, well-documented Spring Boot patterns
> (Spring Data JPA, `MultipartFile` upload, `ResourceRegion` streaming).

The H2 database file is created at `./data/musicdb.mv.db` on first run.
You can inspect it at `http://localhost:8080/h2-console`
(JDBC URL: `jdbc:h2:file:./data/musicdb`, user `sa`, blank password).

## REST API

### Songs

| Method | Endpoint                  | Description                          |
|--------|----------------------------|--------------------------------------|
| GET    | `/api/songs`               | List all songs                       |
| GET    | `/api/songs/{id}`          | Get one song                         |
| GET    | `/api/songs/search?q=...`  | Search by title/artist/album         |
| GET    | `/api/songs/genre/{genre}` | Filter by genre                      |
| POST   | `/api/songs/upload`        | Upload a song (multipart form-data)  |
| PUT    | `/api/songs/{id}`          | Update song metadata                 |
| DELETE | `/api/songs/{id}`          | Delete a song (and its file)         |
| GET    | `/api/songs/{id}/stream`   | Stream audio (supports Range header) |

`POST /api/songs/upload` fields: `file` (required), `title`, `artist`,
`album`, `genre`, `duration` (all optional).

### Playlists

| Method | Endpoint                                    | Description               |
|--------|----------------------------------------------|----------------------------|
| GET    | `/api/playlists`                             | List all playlists         |
| GET    | `/api/playlists/{id}`                        | Get one playlist           |
| POST   | `/api/playlists`                             | Create a playlist          |
| PUT    | `/api/playlists/{id}`                        | Update a playlist          |
| DELETE | `/api/playlists/{id}`                        | Delete a playlist          |
| POST   | `/api/playlists/{playlistId}/songs/{songId}` | Add a song to a playlist   |
| DELETE | `/api/playlists/{playlistId}/songs/{songId}` | Remove a song from playlist|

`POST /api/playlists` body: `{ "name": "...", "description": "...", "songIds": [1,2,3] }`
(`description` and `songIds` optional).

## Possible Next Steps

- User accounts / auth (Spring Security + JWT)
- Album art upload and display
- Like/favorite songs, recently played history
- Swap H2 for Postgres/MySQL for production
- Dockerfile + docker-compose for one-command deployment
