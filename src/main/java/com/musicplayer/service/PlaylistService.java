package com.musicplayer.service;

import com.musicplayer.dto.PlaylistRequest;
import com.musicplayer.entity.Playlist;
import com.musicplayer.entity.Song;
import com.musicplayer.exception.ResourceNotFoundException;
import com.musicplayer.repository.PlaylistRepository;
import com.musicplayer.repository.SongRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final SongRepository songRepository;

    public PlaylistService(PlaylistRepository playlistRepository, SongRepository songRepository) {
        this.playlistRepository = playlistRepository;
        this.songRepository = songRepository;
    }

    public List<Playlist> getAllPlaylists() {
        return playlistRepository.findAll();
    }

    public Playlist getPlaylistById(Long id) {
        return playlistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Playlist not found with id: " + id));
    }

    public Playlist createPlaylist(PlaylistRequest request) {
        Playlist playlist = new Playlist();
        playlist.setName(request.getName());
        playlist.setDescription(request.getDescription());

        if (request.getSongIds() != null && !request.getSongIds().isEmpty()) {
            playlist.setSongs(resolveSongs(request.getSongIds()));
        }
        return playlistRepository.save(playlist);
    }

    public Playlist updatePlaylist(Long id, PlaylistRequest request) {
        Playlist playlist = getPlaylistById(id);
        if (request.getName() != null) {
            playlist.setName(request.getName());
        }
        if (request.getDescription() != null) {
            playlist.setDescription(request.getDescription());
        }
        if (request.getSongIds() != null) {
            playlist.setSongs(resolveSongs(request.getSongIds()));
        }
        return playlistRepository.save(playlist);
    }

    public Playlist addSongToPlaylist(Long playlistId, Long songId) {
        Playlist playlist = getPlaylistById(playlistId);
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Song not found with id: " + songId));
        playlist.getSongs().add(song);
        return playlistRepository.save(playlist);
    }

    public Playlist removeSongFromPlaylist(Long playlistId, Long songId) {
        Playlist playlist = getPlaylistById(playlistId);
        playlist.getSongs().removeIf(s -> s.getId().equals(songId));
        return playlistRepository.save(playlist);
    }

    public void deletePlaylist(Long id) {
        Playlist playlist = getPlaylistById(id);
        playlistRepository.delete(playlist);
    }

    private Set<Song> resolveSongs(List<Long> songIds) {
        Set<Song> songs = new LinkedHashSet<>();
        for (Long songId : songIds) {
            songRepository.findById(songId).ifPresent(songs::add);
        }
        return songs;
    }
}
