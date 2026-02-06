package ssafy_14.BUK_2.GS4cut.domain.personalAnalysis.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import ssafy_14.BUK_2.GS4cut.domain.personalAnalysis.dto.PersonalAnalysisResponse;
import ssafy_14.BUK_2.GS4cut.domain.personalAnalysis.dto.PersonalAnalysisSaveRequest;
import ssafy_14.BUK_2.GS4cut.domain.personalAnalysis.service.PersonalAnalysisService;

import java.net.URI;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/db/share/personal")
public class PersonalAnalysisController {

    private final PersonalAnalysisService service;

    /** 분석 시작 시 placeholder 생성 (ANALYZING 상태) */
    @PostMapping("/placeholder")
    public ResponseEntity<UUID> createPlaceholder() {
        UUID savedId = service.createPlaceholder();

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .replacePath("/api/db/share/personal/{uuid}")
                .buildAndExpand(savedId)
                .toUri();

        return ResponseEntity.created(location).body(savedId);
    }

    /** 분석 완료 후 결과 데이터 업데이트 */
    @PutMapping("/{uuid}")
    public ResponseEntity<Void> updateAnalysis(
            @PathVariable UUID uuid,
            @RequestBody PersonalAnalysisSaveRequest request) {
        service.updateAnalysisResult(uuid, request);
        return ResponseEntity.ok().build();
    }

    // 저장 (기존 방식 유지 - 결과와 함께 저장)
    @PostMapping
    public ResponseEntity<UUID> saveAnalysis(@RequestBody PersonalAnalysisSaveRequest request) {
         UUID savedId = service.save(request);

         URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                 .path("/{uuid}")
                 .buildAndExpand(savedId)
                 .toUri();

         return ResponseEntity.created(location).body(savedId);
    }

    // 조회 (공유 링크로 들어왔을 때)
    @GetMapping("/{uuid}")
    public ResponseEntity<PersonalAnalysisResponse> getAnalysis(@PathVariable UUID uuid) {
        PersonalAnalysisResponse response = service.findById(uuid);

        return ResponseEntity.ok(response);
    }
}
