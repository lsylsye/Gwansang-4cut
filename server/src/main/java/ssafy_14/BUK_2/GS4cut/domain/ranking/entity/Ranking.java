package ssafy_14.BUK_2.GS4cut.domain.ranking.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Builder;
import java.util.List;
import java.util.ArrayList;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
    
@Entity
@Table(name = "ranking")
@Getter @NoArgsConstructor
public class Ranking {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long rankingId;

    private String title; // 랭킹에 등록된 이름
    private String content; // 랭킹에 등록된 내용
    private Long score; // 랭킹에 등록된 점수
    private Long numberOfMembers; // 랭킹에 등록된 멤버 수
    
    @Column(columnDefinition = "TEXT")
    private String memberNames; // 멤버 이름 리스트 (JSON 문자열로 저장)

    @Builder
    public Ranking(String title, String content, Long score, Long numberOfMembers, String memberNames) {
        this.title = title;
        this.content = content;
        this.score = score;
        this.numberOfMembers = numberOfMembers;
        this.memberNames = memberNames;
    }
    
    // 편의 메서드: JSON 문자열을 List<MemberName>으로 변환
    public List<ssafy_14.BUK_2.GS4cut.domain.ranking.dto.MemberName> getMemberNamesList() {
        if (memberNames == null || memberNames.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(memberNames, new TypeReference<List<ssafy_14.BUK_2.GS4cut.domain.ranking.dto.MemberName>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
    
}