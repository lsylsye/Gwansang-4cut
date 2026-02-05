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


    @Id
    @Column(name = "uuid", columnDefinition = "BINARY(16)")
    private UUID uuid;

    @Column(columnDefinition = "json")
    private String analysisData;

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

    public static PersonalAnalysis create(String jsonResult) {
        PersonalAnalysis analysis = new PersonalAnalysis();
        analysis.analysisData = jsonResult;

        return analysis;
    }
}
