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

    // 저장
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
