package ssafy_14.BUK_2.GS4cut.domain.ranking.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import ssafy_14.BUK_2.GS4cut.domain.ranking.entity.Ranking;
import java.util.List;

@Getter
@NoArgsConstructor
public class RankingListResponse {

    private Long score;
    private String title;
    private Long numberOfMembers;
    private List<MemberName> memberNames;

    @Builder
    public RankingListResponse(Long score, String title, Long numberOfMembers, List<MemberName> memberNames) {
        this.score = score;
        this.title = title;
        this.numberOfMembers = numberOfMembers;
        this.memberNames = memberNames;
    }

    public static RankingListResponse from(Ranking entity) {
        return RankingListResponse.builder()
                .score(entity.getScore())
                .title(entity.getTitle())
                .numberOfMembers(entity.getNumberOfMembers())
                .memberNames(entity.getMemberNamesList())
                .build();
    }
}
