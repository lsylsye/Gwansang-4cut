package ssafy_14.BUK_2.GS4cut.domain.ranking.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import ssafy_14.BUK_2.GS4cut.domain.ranking.repository.RankingRepository;
import ssafy_14.BUK_2.GS4cut.domain.ranking.dto.RankingRegisterRequest;
import ssafy_14.BUK_2.GS4cut.domain.ranking.entity.Ranking;
import org.springframework.transaction.annotation.Transactional;
import ssafy_14.BUK_2.GS4cut.domain.ranking.dto.RankingListResponse;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RankingService {

    private final RankingRepository rankingRepository;

    @Transactional
    public void registerRanking(RankingRegisterRequest request) {
        rankingRepository.save(request.toEntity());
    }

    @Transactional(readOnly = true)
    public List<RankingListResponse> getRankings() {
        List<Ranking> all = rankingRepository.findAllByOrderByScoreDesc();
        return all.stream()
                .map(RankingListResponse::from)
                .collect(Collectors.toList());
    }

}