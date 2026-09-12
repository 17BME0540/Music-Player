package com.musicplayer.service;

import com.musicplayer.entity.Song;
import com.musicplayer.exception.ResourceNotFoundException;
import com.musicplayer.repository.SongRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
public class SongService {

    private final SongRepository songRepository;
    private final FileStorageService fileStorageService;

    public SongService(SongRepository songRepository, FileStorageService fileStorageService) {
        this.songRepository = songRepository;
        this.fileStorageService = fileStorageService;
    }

    public List<Song> getAllSongs() {
        return songRepository.findAll();
    }

    public Song getSongById(Long id) {
        return songRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Song not found with id: " + id));
    }

    public List<Song> search(String query) {
        return songRepository
                .findByTitleContainingIgnoreCaseOrArtistContainingIgnoreCaseOrAlbumContainingIgnoreCase(
                        query, query, query);
    }

    public List<Song> getByGenre(String genre) {
        return songRepository.findByGenreIgnoreCase(genre);
    }

    public Song uploadSong(MultipartFile file, String title, String artist, String album,
                            String genre, Integer duration) {
        String storedFileName = fileStorageService.storeFile(file);

        Song song = new Song();
        song.setTitle(title != null && !title.isBlank() ? title : file.getOriginalFilename());
        song.setArtist(artist);
        song.setAlbum(album);
        song.setGenre(genre);
        song.setDuration(duration);
        song.setFileName(storedFileName);
        song.setOriginalFileName(file.getOriginalFilename());
        song.setContentType(file.getContentType());
        song.setFileSize(file.getSize());

        return songRepository.save(song);
    }

    public Song updateMetadata(Long id, String title, String artist, String album,
                                String genre, Integer duration) {
        Song song = getSongById(id);
        if (title != null) song.setTitle(title);
        if (artist != null) song.setArtist(artist);
        if (album != null) song.setAlbum(album);
        if (genre != null) song.setGenre(genre);
        if (duration != null) song.setDuration(duration);
        return songRepository.save(song);
    }

    public void deleteSong(Long id) {
        Song song = getSongById(id);
        fileStorageService.deleteFile(song.getFileName());
        songRepository.delete(song);
    }
}
