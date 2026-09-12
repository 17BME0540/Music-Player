package com.musicplayer.controller;

import com.musicplayer.dto.PlaylistRequest;
import com.musicplayer.entity.Playlist;
import com.musicplayer.service.PlaylistService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/playlists")
public class PlaylistController {

    private final PlaylistService playlistService;

    public PlaylistController(PlaylistService playlistService) {
        this.playlistService = playlistService;
    }

    @GetMapping
    public List<Playlist> getAllPlaylists() {
        return playlistService.getAllPlaylists();
    }

    @GetMapping("/{id}")
    public Playlist getPlaylist(@PathVariable Long id) {
        return playlistService.getPlaylistById(id);
    }

    @PostMapping
    public ResponseEntity<Playlist> createPlaylist(@Valid @RequestBody PlaylistRequest request) {
        Playlist playlist = playlistService.createPlaylist(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(playlist);
    }

    @PutMapping("/{id}")
    public Playlist updatePlaylist(@PathVariable Long id, @RequestBody PlaylistRequest request) {
        return playlistService.updatePlaylist(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlaylist(@PathVariable Long id) {
        playlistService.deletePlaylist(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{playlistId}/songs/{songId}")
    public Playlist addSong(@PathVariable Long playlistId, @PathVariable Long songId) {
        return playlistService.addSongToPlaylist(playlistId, songId);
    }

    @DeleteMapping("/{playlistId}/songs/{songId}")
    public Playlist removeSong(@PathVariable Long playlistId, @PathVariable Long songId) {
        return playlistService.removeSongFromPlaylist(playlistId, songId);
    }
}
