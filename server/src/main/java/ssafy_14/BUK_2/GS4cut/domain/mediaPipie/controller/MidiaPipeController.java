package ssafy_14.BUK_2.GS4cut.domain.mediaPipie.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ssafy_14.BUK_2.GS4cut.domain.mediaPipie.dto.MediaPipeRequest;
import ssafy_14.BUK_2.GS4cut.domain.mediaPipie.entity.Tests;
import ssafy_14.BUK_2.GS4cut.domain.mediaPipie.repository.MediaPipeRepository;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/db")
public class MidiaPipeController {

    private final MediaPipeRepository mediaPipeRepository;

    @PostMapping("/facemesh")
    public ResponseEntity<String> getMediaPipe(@RequestBody MediaPipeRequest request) {
        Tests tests = new Tests("테스트성공");
        mediaPipeRepository.save(tests);
        return ResponseEntity.status(HttpStatus.OK).body("수신 완료");
    }
}
