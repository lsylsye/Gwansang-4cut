package ssafy_14.BUK_2.GS4cut.domain.personalAnalysis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import ssafy_14.BUK_2.GS4cut.domain.personalAnalysis.entity.PersonalAnalysis;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PersonalAnalysisResponse {
    
    private UUID id;
    private String analysisData;
    private String status;  // ANALYZING or COMPLETED
    private LocalDateTime createdAt;
    
    public static PersonalAnalysisResponse from(PersonalAnalysis entity) {
        return PersonalAnalysisResponse.builder()
                .id(entity.getUuid())
                .analysisData(entity.getAnalysisData())
                .status(entity.getStatus().name())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
