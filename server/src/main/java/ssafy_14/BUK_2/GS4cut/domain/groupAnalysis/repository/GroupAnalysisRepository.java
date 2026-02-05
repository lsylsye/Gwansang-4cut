package ssafy_14.BUK_2.GS4cut.domain.groupAnalysis.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ssafy_14.BUK_2.GS4cut.domain.groupAnalysis.entity.GroupAnalysis;

import java.util.UUID;

public interface GroupAnalysisRepository extends JpaRepository<GroupAnalysis, UUID> {
}
