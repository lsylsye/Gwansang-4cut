package ssafy_14.BUK_2.GS4cut.domain.ranking.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import ssafy_14.BUK_2.GS4cut.domain.ranking.entity.Ranking;
import org.springframework.stereotype.Repository;


@Repository
public interface RankingRepository extends JpaRepository<Ranking, Long> {

    /** 점수 내림차순 정렬 (score가 Long이므로 OrderByScoreDesc 정상 동작) */
    List<Ranking> findAllByOrderByScoreDesc();
}
