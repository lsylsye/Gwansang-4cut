package ssafy_14.BUK_2.GS4cut.domain.ranking.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MemberName {
    private String name;

    public MemberName(String name) {
        this.name = name;
    }
}
