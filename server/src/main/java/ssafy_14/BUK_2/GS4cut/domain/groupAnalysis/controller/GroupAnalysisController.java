package ssafy_14.BUK_2.GS4cut.domain.groupAnalysis.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import ssafy_14.BUK_2.GS4cut.domain.groupAnalysis.dto.GroupAnalysisResponse;
import ssafy_14.BUK_2.GS4cut.domain.groupAnalysis.dto.GroupAnalysisSaveRequest;
import ssafy_14.BUK_2.GS4cut.domain.groupAnalysis.service.GroupAnalysisService;

import java.net.URI;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/db/share/group")
public class GroupAnalysisController {

    private final GroupAnalysisService service;

    /** 분석 시작 시 placeholder 생성 (ANALYZING 상태) */
    @PostMapping("/placeholder")
    public ResponseEntity<UUID> createPlaceholder() {
        UUID savedId = service.createPlaceholder();

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .replacePath("/api/db/share/group/{uuid}")
                .buildAndExpand(savedId)
                .toUri();

        return ResponseEntity.created(location).body(savedId);
    }

    /** 분석 완료 후 결과 데이터 업데이트 */
    @PutMapping("/{uuid}")
    public ResponseEntity<Void> updateAnalysis(
            @PathVariable UUID uuid,
            @RequestBody GroupAnalysisSaveRequest request) {
        service.updateAnalysisResult(uuid, request);
        return ResponseEntity.ok().build();
    }

    // 저장 (기존 방식 유지 - 결과와 함께 저장)
    @PostMapping
    public ResponseEntity<UUID> saveAnalysis(@RequestBody GroupAnalysisSaveRequest request) {
        UUID savedId = service.save(request);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{uuid}")
                .buildAndExpand(savedId)
                .toUri();

        return ResponseEntity.created(location).body(savedId);
    }

    // 조회
    @GetMapping("/{uuid}")
    public ResponseEntity<GroupAnalysisResponse> getAnalysis(@PathVariable UUID uuid) {
        GroupAnalysisResponse response = service.findById(uuid);

        return ResponseEntity.ok(response);
    }
}
