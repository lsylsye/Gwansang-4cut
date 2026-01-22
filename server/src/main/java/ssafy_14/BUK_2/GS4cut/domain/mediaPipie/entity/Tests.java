package ssafy_14.BUK_2.GS4cut.domain.mediaPipie.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor @Getter
public class Tests {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private String testId;

    private String test;

    public Tests(String test) {
        this.test = test;
    }
}
