package com.musicplayer.ai;

import com.musicplayer.dto.AiChatResponse;
import com.musicplayer.entity.Song;
import com.musicplayer.exception.AiServiceException;
import com.musicplayer.repository.SongRepository;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Lets a user describe the kind of music they want in plain English
 * ("something upbeat for a workout") and uses Spring AI's ChatClient to
 * match that description against the songs actually in the library.
 */
@Service
public class AiChatService {

    private static final Pattern MATCH_LINE = Pattern.compile("MATCHING_IDS:\\s*([0-9,\\s]*)");

    private final ChatClient chatClient;
    private final SongRepository songRepository;

    public AiChatService(ChatClient.Builder chatClientBuilder, SongRepository songRepository) {
        this.chatClient = chatClientBuilder.build();
        this.songRepository = songRepository;
    }

    public AiChatResponse findSongsByDescription(String userMessage) {
        List<Song> library = songRepository.findAll();

        String catalog = library.isEmpty()
                ? "(the library is empty right now)"
                : library.stream()
                    .map(s -> String.format("ID:%d | \"%s\" by %s | album: %s | genre: %s",
                            s.getId(), s.getTitle(), s.getArtist(), s.getAlbum(), s.getGenre()))
                    .collect(Collectors.joining("\n"));

        String prompt = """
                You are a friendly music assistant embedded in a music player app.
                Here is the current song catalog:
                %s

                The user is looking for music matching this description: "%s"

                First, write one short, friendly sentence recommending what to play (or explain
                that nothing in the catalog matches). Then, on its own final line, output exactly:
                MATCHING_IDS: <comma-separated numeric IDs from the catalog above that best match>
                Use an empty value after the colon if nothing matches. Never invent IDs that
                are not listed above.
                """.formatted(catalog, userMessage);

        String response;
        try {
            response = chatClient.prompt().user(prompt).call().content();
        } catch (Exception e) {
            throw new AiServiceException(
                    "The AI assistant is unavailable right now. Make sure OPENAI_API_KEY is configured on the server.",
                    e);
        }

        List<Long> matchedIds = extractMatchedIds(response);
        List<Song> matchedSongs = matchedIds.isEmpty() ? List.of() : songRepository.findAllById(matchedIds);
        String reply = stripMatchLine(response);

        return new AiChatResponse(reply, matchedSongs);
    }

    private List<Long> extractMatchedIds(String response) {
        List<Long> ids = new ArrayList<>();
        Matcher matcher = MATCH_LINE.matcher(response == null ? "" : response);
        if (matcher.find()) {
            String raw = matcher.group(1);
            for (String part : raw.split(",")) {
                String trimmed = part.trim();
                if (!trimmed.isEmpty()) {
                    try {
                        ids.add(Long.parseLong(trimmed));
                    } catch (NumberFormatException ignored) {
                        // skip anything the model didn't format as a plain integer
                    }
                }
            }
        }
        return ids;
    }

    private String stripMatchLine(String response) {
        if (response == null) return "";
        return MATCH_LINE.matcher(response).replaceAll("").trim();
    }
}
