package ssafy_14.BUK_2.GS4cut.domain.ranking.dto;
import lombok.Getter;
import lombok.NoArgsConstructor;
import ssafy_14.BUK_2.GS4cut.domain.ranking.entity.Ranking;
import java.util.List;
import com.fasterxml.jackson.databind.ObjectMapper;

@Getter
@NoArgsConstructor
public class RankingRegisterRequest {

    /** 랭킹에 등록된 점수 (엔티티 score) */
    private Long score;
    /** 랭킹에 등록된 이름 (엔티티 title) */
    private String title;
    /** 랭킹에 등록된 멤버 수 (엔티티 numberOfMembers) */
    private Long numberOfMembers;
    /** 랭킹에 등록된 멤버 이름 리스트 */
    private List<MemberName> memberNames;

    public Ranking toEntity() {
        // memberNames를 JSON 문자열로 변환
        String memberNamesJson = "[]";
        if (memberNames != null && !memberNames.isEmpty()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                memberNamesJson = mapper.writeValueAsString(memberNames);
            } catch (Exception e) {
                memberNamesJson = "[]";
            }
        }
        
        return Ranking.builder()
                .score(score != null ? score : 0L)
                .title(title != null ? title.trim() : "")
                .numberOfMembers(numberOfMembers != null ? numberOfMembers : 0L)
                .content("") // content 필드는 유지하되 빈 문자열로 설정
                .memberNames(memberNamesJson)
                .build();
    }
}
