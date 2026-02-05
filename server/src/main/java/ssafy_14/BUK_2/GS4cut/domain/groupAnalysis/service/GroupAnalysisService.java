package ssafy_14.BUK_2.GS4cut.domain.groupAnalysis.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ssafy_14.BUK_2.GS4cut.domain.groupAnalysis.dto.GroupAnalysisResponse;
import ssafy_14.BUK_2.GS4cut.domain.groupAnalysis.dto.GroupAnalysisSaveRequest;
import ssafy_14.BUK_2.GS4cut.domain.groupAnalysis.entity.GroupAnalysis;
import ssafy_14.BUK_2.GS4cut.domain.groupAnalysis.repository.GroupAnalysisRepository;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GroupAnalysisService {

    private final GroupAnalysisRepository repository;

    // 저장
    @Transactional
    public UUID save(GroupAnalysisSaveRequest request) {
        // 1. DTO -> Entity 변환
        GroupAnalysis analysis = GroupAnalysis.create(request.getJsonData());

        // 2. DB 저장
        GroupAnalysis savedAnalysis = repository.save(analysis);

        // 3. ID 반환
        return savedAnalysis.getUuid();
    }

    public GroupAnalysisResponse findById(UUID uuid) {
        // 1. DB 조회 및 예외 처리 (없으면 404)
        GroupAnalysis analysis = repository.findById(uuid)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 id입니다."));

        return GroupAnalysisResponse.from(analysis);
    }
}
