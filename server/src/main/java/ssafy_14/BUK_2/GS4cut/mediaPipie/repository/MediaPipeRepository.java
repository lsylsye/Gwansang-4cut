package ssafy_14.BUK_2.GS4cut.mediaPipie.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ssafy_14.BUK_2.GS4cut.mediaPipie.entity.Tests;

@Repository
public interface MediaPipeRepository extends JpaRepository<Tests, Long> {

}
