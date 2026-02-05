package ssafy_14.BUK_2.GS4cut.domain.ranking.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.http.HttpStatus;
import java.util.List;
import lombok.RequiredArgsConstructor;
import ssafy_14.BUK_2.GS4cut.domain.ranking.dto.RankingRegisterRequest;
import ssafy_14.BUK_2.GS4cut.domain.ranking.dto.RankingListResponse;
import ssafy_14.BUK_2.GS4cut.domain.ranking.service.RankingService;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/db")
public class RankingController {

    private final RankingService rankingService;

    @PostMapping("/ranking")
    public ResponseEntity<String> registerRanking(@RequestBody RankingRegisterRequest request) {
        rankingService.registerRanking(request);
        return ResponseEntity.status(HttpStatus.CREATED).body("랭킹 등록 완료");
    }

    @GetMapping("/ranking")
    public ResponseEntity<List<RankingListResponse>> getRankings() {
        List<RankingListResponse> response = rankingService.getRankings();
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }
}
