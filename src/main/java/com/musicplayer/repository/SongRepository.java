package com.musicplayer.repository;

import com.musicplayer.entity.Song;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SongRepository extends JpaRepository<Song, Long> {

    List<Song> findByTitleContainingIgnoreCaseOrArtistContainingIgnoreCaseOrAlbumContainingIgnoreCase(
            String title, String artist, String album);

    List<Song> findByGenreIgnoreCase(String genre);
}
