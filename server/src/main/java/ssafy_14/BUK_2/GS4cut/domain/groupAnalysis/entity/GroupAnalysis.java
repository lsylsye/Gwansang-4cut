package ssafy_14.BUK_2.GS4cut.domain.groupAnalysis.entity;

import jakarta.persistence.*;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Entity
@Table(name = "group_analysis")
public class GroupAnalysis {

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

    public static GroupAnalysis create(String jsonResult) {
        GroupAnalysis analysis = new GroupAnalysis();
        analysis.analysisData = jsonResult;

        return analysis;
    }
}
