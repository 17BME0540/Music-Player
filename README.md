# Resonance — Full Stack Spring Boot Music Player

A self-contained full stack music player: a Spring Boot REST API backend
(auth, song/playlist management, file upload, range-request audio
streaming, an AI chat assistant) and a modern HTML/CSS/JS frontend served
straight from the same app.

## Features

- **Accounts & security** — register/login, JWT-based auth (Spring Security);
  browsing and streaming are public, uploading/editing/deleting requires login
- **AI DJ** — describe what you want ("something chill for studying") and a
  Spring AI–powered assistant (`/api/ai/chat`) picks matching tracks from
  your own library
- Upload audio files (mp3, wav, etc.) with metadata (title, artist, album, genre)
- Browse/search all songs (by title, artist, or album)
- Create, update, and delete playlists; add/remove songs from playlists
- Stream audio with HTTP range-request support (seekable HTML5 `<audio>` player)
- Play / pause / next / previous / seek / volume controls
- Modern, professional UI: gradient accents, glassy cards, dark theme
- H2 file-based database — no external DB setup required

## Tech Stack

- **Backend:** Java 17, Spring Boot 3.3 (Spring MVC + Spring Data JPA),
  Spring Security + JWT (jjwt), Spring AI (OpenAI-backed `ChatClient`), H2
- **Frontend:** HTML, CSS, vanilla JavaScript (served as Spring Boot static resources)

## Project Structure

```
music-player-spring-boot/
├── pom.xml
├── src/main/java/com/musicplayer/
│   ├── MusicPlayerApplication.java
│   ├── config/          # CORS + upload-dir configuration
│   ├── security/        # JWT filter/util, Spring Security config, UserDetailsService
│   ├── ai/               # Spring AI chat assistant service
│   ├── entity/           # Song, Playlist, User JPA entities
│   ├── repository/       # Spring Data repositories
│   ├── service/          # Business logic + file storage
│   ├── controller/       # REST controllers (songs, playlists, auth, ai)
│   ├── exception/        # Custom exceptions + global handler
│   └── dto/              # Request/response DTOs
├── src/main/resources/
│   ├── application.properties
│   └── static/           # index.html, css/, js/  (the frontend)
└── uploads/               # uploaded audio files land here at runtime
```

## Running Locally

Requires Java 17+ and Maven (or use an IDE with the Maven wrapper).

```bash
export OPENAI_API_KEY=sk-...      # optional — enables the AI DJ
export JWT_SECRET=$(openssl rand -base64 32)   # recommended for anything beyond local testing
mvn spring-boot:run
```

Then open **http://localhost:8080** in your browser.

> **Note:** this project was built and reviewed in a sandbox without outbound
> access to Maven Central, so a full `mvn` build could not be run to verify
> it end-to-end. The code follows standard, well-documented patterns for
> each piece (Spring Data JPA, `MultipartFile` upload, `ResourceRegion`
> streaming, Spring Security's JWT filter chain, Spring AI's `ChatClient`),
> but please run a build locally right after cloning and fix up anything
> version-specific if it doesn't compile clean on the first try — in
> particular, double check the `spring-ai-starter-model-openai` artifact
> name/version against whatever's current when you build, since Spring AI's
> artifact names have shifted between milestone and GA releases.

The H2 database file is created at `./data/musicdb.mv.db` on first run.
Inspect it at `http://localhost:8080/h2-console`
(JDBC URL: `jdbc:h2:file:./data/musicdb`, user `sa`, blank password).

## Authentication

| Method | Endpoint             | Description                          |
|--------|----------------------|---------------------------------------|
| POST   | `/api/auth/register` | Create an account, returns a JWT     |
| POST   | `/api/auth/login`    | Log in, returns a JWT                |

Both return `{ "token": "...", "username": "..." }`. Send the token on
subsequent requests as `Authorization: Bearer <token>`.

**Public without a token:** `GET` on `/api/songs/**` and `/api/playlists/**`
(including streaming), plus the frontend itself.
**Requires a token:** uploading/editing/deleting songs, all playlist
mutations, and `/api/ai/chat`.

## REST API

### Songs

| Method | Endpoint                  | Auth | Description                          |
|--------|----------------------------|------|--------------------------------------|
| GET    | `/api/songs`               | No   | List all songs                       |
| GET    | `/api/songs/{id}`          | No   | Get one song                         |
| GET    | `/api/songs/search?q=...`  | No   | Search by title/artist/album         |
| GET    | `/api/songs/genre/{genre}` | No   | Filter by genre                      |
| GET    | `/api/songs/{id}/stream`   | No   | Stream audio (supports Range header) |
| POST   | `/api/songs/upload`        | Yes  | Upload a song (multipart form-data)  |
| PUT    | `/api/songs/{id}`          | Yes  | Update song metadata                 |
| DELETE | `/api/songs/{id}`          | Yes  | Delete a song (and its file)         |

`POST /api/songs/upload` fields: `file` (required), `title`, `artist`,
`album`, `genre`, `duration` (all optional).

### Playlists

| Method | Endpoint                                    | Auth | Description               |
|--------|----------------------------------------------|------|----------------------------|
| GET    | `/api/playlists`                             | No   | List all playlists         |
| GET    | `/api/playlists/{id}`                        | No   | Get one playlist           |
| POST   | `/api/playlists`                             | Yes  | Create a playlist          |
| PUT    | `/api/playlists/{id}`                        | Yes  | Update a playlist          |
| DELETE | `/api/playlists/{id}`                        | Yes  | Delete a playlist          |
| POST   | `/api/playlists/{playlistId}/songs/{songId}` | Yes  | Add a song to a playlist   |
| DELETE | `/api/playlists/{playlistId}/songs/{songId}` | Yes  | Remove a song from playlist|

`POST /api/playlists` body: `{ "name": "...", "description": "...", "songIds": [1,2,3] }`
(`description` and `songIds` optional).

### AI DJ

| Method | Endpoint       | Auth | Description                                    |
|--------|----------------|------|-------------------------------------------------|
| POST   | `/api/ai/chat` | Yes  | `{ "message": "..." }` → `{ reply, songs[] }`  |

Without `OPENAI_API_KEY` set, this returns `503` with a message explaining
the assistant isn't configured — everything else in the app still works.

## Deployment Notes

- Set real values for `JWT_SECRET` and `OPENAI_API_KEY` as environment
  variables in whatever platform you deploy to — don't rely on the
  development defaults in `application.properties`.
- H2 file storage and the `uploads/` folder are fine for a demo/single
  instance; for anything more permanent, swap in Postgres/MySQL and
  object storage (S3, etc.) for uploaded audio.

## Possible Next Steps

- Role-based access (admin vs. regular user), per-user playlists/libraries
- Album art upload and display
- Like/favorite songs, recently played history
- Swap H2 for Postgres/MySQL for production
- Dockerfile + docker-compose for one-command deployment
- Vector-store-backed recommendations (Spring AI supports this directly)
  instead of stuffing the whole catalog into the prompt
