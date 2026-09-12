package com.musicplayer.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public class PlaylistRequest {

    @NotBlank
    private String name;

    private String description;

    /** Optional list of song IDs to seed the playlist with. */
    private List<Long> songIds;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Long> getSongIds() {
        return songIds;
    }

    public void setSongIds(List<Long> songIds) {
        this.songIds = songIds;
    }
}
