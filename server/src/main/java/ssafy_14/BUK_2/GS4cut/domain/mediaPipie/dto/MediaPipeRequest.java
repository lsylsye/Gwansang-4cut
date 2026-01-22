package ssafy_14.BUK_2.GS4cut.domain.mediaPipie.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@NoArgsConstructor @Getter
public class MediaPipeRequest {


    private LocalDateTime timestamp;

    private List<FaceDto> faces;

    @Getter
    @NoArgsConstructor
    public static class FaceDto {

        private Integer faceIndex;
        private Long duration;
        private List<LandmarkDto> landmarks;
    }

    @Getter
    @NoArgsConstructor
    public static class LandmarkDto {

        private Integer index;
        private Double x;
        private Double y;
        private Double z;
    }
}
