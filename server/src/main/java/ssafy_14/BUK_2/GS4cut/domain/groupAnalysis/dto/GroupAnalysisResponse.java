package ssafy_14.BUK_2.GS4cut.domain.groupAnalysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import ssafy_14.BUK_2.GS4cut.domain.groupAnalysis.entity.GroupAnalysis;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroupAnalysisResponse {

    private UUID id;
    private String analysisData;
    private LocalDateTime createdAt;

    public static GroupAnalysisResponse from(GroupAnalysis entity) {
        return GroupAnalysisResponse.builder()
                .id(entity.getUuid())
                .analysisData(entity.getAnalysisData())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
