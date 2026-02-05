package ssafy_14.BUK_2.GS4cut.domain.personalAnalysis.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ssafy_14.BUK_2.GS4cut.domain.personalAnalysis.entity.PersonalAnalysis;

import java.util.UUID;

@Repository
public interface PersonalAnalysisRepository extends JpaRepository<PersonalAnalysis, UUID> {

}
