package ssafy_14.BUK_2.GS4cut.domain.personalAnalysis.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ssafy_14.BUK_2.GS4cut.domain.personalAnalysis.dto.PersonalAnalysisResponse;
import ssafy_14.BUK_2.GS4cut.domain.personalAnalysis.dto.PersonalAnalysisSaveRequest;
import ssafy_14.BUK_2.GS4cut.domain.personalAnalysis.entity.PersonalAnalysis;
import ssafy_14.BUK_2.GS4cut.domain.personalAnalysis.repository.PersonalAnalysisRepository;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PersonalAnalysisService {

    private final PersonalAnalysisRepository repository;

    /** 분석 시작 시 placeholder 생성 (ANALYZING 상태) */
    @Transactional
    public UUID createPlaceholder() {
        PersonalAnalysis analysis = PersonalAnalysis.createPlaceholder();
        PersonalAnalysis savedAnalysis = repository.save(analysis);
        return savedAnalysis.getUuid();
    }

    /** 분석 완료 후 결과 데이터 업데이트 */
    @Transactional
    public void updateAnalysisResult(UUID uuid, PersonalAnalysisSaveRequest request) {
        PersonalAnalysis analysis = repository.findById(uuid)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 id입니다."));
        analysis.updateAnalysisData(request.getJsonData());
    }

    // 저장 로직 (기존 방식 유지 - 결과와 함께 저장)
    @Transactional
    public UUID save(PersonalAnalysisSaveRequest request) {
        // 1. DTO -> Entity 변환
        PersonalAnalysis analysis = PersonalAnalysis.create(request.getJsonData());

        // 2. DB 저장
        PersonalAnalysis savedAnalysis = repository.save(analysis);

        // 3. ID 반환
        return savedAnalysis.getUuid();
    }

    public PersonalAnalysisResponse findById(UUID uuid) {
        // 1. DB 조회 및 예외 처리 (없으면 404)
        PersonalAnalysis analysis = repository.findById(uuid)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 id입니다."));

        return PersonalAnalysisResponse.from(analysis);
    }
}
