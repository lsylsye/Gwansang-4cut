package ssafy_14.BUK_2.GS4cut.domain.personalAnalysis.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "personal_analysis")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PersonalAnalysis {

    public enum AnalysisStatus {
        ANALYZING,  // 분석 중
        COMPLETED   // 분석 완료
    }

    @Id
    @Column(name = "uuid", columnDefinition = "BINARY(16)")
    private UUID uuid;

    @Column(columnDefinition = "json")
    private String analysisData;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AnalysisStatus status = AnalysisStatus.ANALYZING;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.uuid == null) {
            this.uuid = UUID.randomUUID();
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    /** 분석 시작 시 placeholder 생성 (분석 중 상태) */
    public static PersonalAnalysis createPlaceholder() {
        PersonalAnalysis analysis = new PersonalAnalysis();
        analysis.status = AnalysisStatus.ANALYZING;
        return analysis;
    }

    /** 기존 방식: 결과와 함께 생성 (분석 완료 상태) */
    public static PersonalAnalysis create(String jsonResult) {
        PersonalAnalysis analysis = new PersonalAnalysis();
        analysis.analysisData = jsonResult;
        analysis.status = AnalysisStatus.COMPLETED;
        return analysis;
    }

    /** 분석 결과 업데이트 */
    public void updateAnalysisData(String jsonResult) {
        this.analysisData = jsonResult;
        this.status = AnalysisStatus.COMPLETED;
    }
}
