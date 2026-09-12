package com.musicplayer.controller;

import com.musicplayer.entity.Song;
import com.musicplayer.service.FileStorageService;
import com.musicplayer.service.SongService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/songs")
public class SongController {

    private static final long CHUNK_SIZE = 1024L * 1024L; // 1MB streaming chunks

    private final SongService songService;
    private final FileStorageService fileStorageService;

    public SongController(SongService songService, FileStorageService fileStorageService) {
        this.songService = songService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public List<Song> getAllSongs() {
        return songService.getAllSongs();
    }

    @GetMapping("/{id}")
    public Song getSong(@PathVariable Long id) {
        return songService.getSongById(id);
    }

    @GetMapping("/search")
    public List<Song> search(@RequestParam String q) {
        return songService.search(q);
    }

    @GetMapping("/genre/{genre}")
    public List<Song> byGenre(@PathVariable String genre) {
        return songService.getByGenre(genre);
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Song> uploadSong(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "artist", required = false) String artist,
            @RequestParam(value = "album", required = false) String album,
            @RequestParam(value = "genre", required = false) String genre,
            @RequestParam(value = "duration", required = false) Integer duration) {
        Song saved = songService.uploadSong(file, title, artist, album, genre, duration);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public Song updateSong(
            @PathVariable Long id,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "artist", required = false) String artist,
            @RequestParam(value = "album", required = false) String album,
            @RequestParam(value = "genre", required = false) String genre,
            @RequestParam(value = "duration", required = false) Integer duration) {
        return songService.updateMetadata(id, title, artist, album, genre, duration);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSong(@PathVariable Long id) {
        songService.deleteSong(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Streams the audio file for a song, honoring HTTP Range requests so that
     * the HTML5 audio player can seek without downloading the whole file.
     */
    @GetMapping("/{id}/stream")
    public ResponseEntity<ResourceRegion> streamSong(
            @PathVariable Long id,
            @RequestHeader HttpHeaders headers) throws IOException {

        Song song = songService.getSongById(id);
        Resource audioResource = fileStorageService.loadFileAsResource(song.getFileName());
        long contentLength = audioResource.contentLength();

        MediaType mediaType = MediaTypeFactory.getMediaType(audioResource)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        List<HttpRange> ranges = headers.getRange();
        ResourceRegion region;
        HttpStatus status;

        if (!ranges.isEmpty()) {
            HttpRange range = ranges.get(0);
            long start = range.getRangeStart(contentLength);
            long end = range.getRangeEnd(contentLength);
            long rangeLength = Math.min(CHUNK_SIZE, end - start + 1);
            region = new ResourceRegion(audioResource, start, rangeLength);
            status = HttpStatus.PARTIAL_CONTENT;
        } else {
            long rangeLength = Math.min(CHUNK_SIZE, contentLength);
            region = new ResourceRegion(audioResource, 0, rangeLength);
            status = HttpStatus.OK;
        }

        return ResponseEntity.status(status)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .contentType(mediaType)
                .body(region);
    }
}
