package com.musicplayer;

import com.musicplayer.config.FileStorageProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(FileStorageProperties.class)
public class MusicPlayerApplication {

    public static void main(String[] args) {
        SpringApplication.run(MusicPlayerApplication.class, args);
    }
}
