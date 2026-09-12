package com.musicplayer.dto;

import com.musicplayer.entity.Song;

import java.util.List;

public class AiChatResponse {

    private String reply;
    private List<Song> songs;

    public AiChatResponse(String reply, List<Song> songs) {
        this.reply = reply;
        this.songs = songs;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public List<Song> getSongs() {
        return songs;
    }

    public void setSongs(List<Song> songs) {
        this.songs = songs;
    }
}
