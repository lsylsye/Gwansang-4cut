# 관상 조합표 (마의상법/신상전편 기반)

조합표는 "조건(라벨) → 결과 태그" 형태로, RAG/규칙엔진이 바로 사용할 수 있도록 구성되었소.

---

## 1) 삼정(三停) MACRO-01~06

### MACRO-01: 균형형 (life_balance_wealth_longevity)
**조건:**
- `upper_section_label=long` AND (`forehead_width_label=wide` OR `forehead_width_label=normal`)
- `mid_section_label=long`
- `lower_section_label=long`
- `three_section_balanced=true`

**해석:** 초·중·말년이 모두 길고 균형 잡힌 상이오. 일생이 안정적이고 재물·장수운이 좋은 상이로다.

---

### MACRO-02: 자수성가형 (early_hard_late_rise)
**조건:**
- `upper_section_label=short`
- `mid_section_label=long` AND `lower_section_label=long`

**해석:** 초년은 약하나 중·말년에 길이 살아나는 자수성가형이오. 젊어서 고생하나 나이 들수록 복이 붙는 상이로다.

---

### MACRO-03: 초강후약형 (strong_start_weak_finish)
**조건:**
- `upper_section_label=long` AND `mid_section_label=long`
- `lower_section_label=short` OR `lower_face_label=weak`

**해석:** 초·중년은 버티나 말년운이 약한 상이오. 젊을 때 기반을 다지고 말년을 대비하시오.

---

### MACRO-04: 대기만성형 (late_bloomer)
**조건:**
- `upper_section_label=short` AND `mid_section_label=short`
- `lower_section_label=long` OR `lower_face_label=strong`

**해석:** 초·중년은 약하나 말년에 크게 일어나는 대기만성형이오. 인내심을 갖고 기다리면 복이 오리라.

---

### MACRO-05: 중년 리스크형 (midlife_dip_risk)
**조건:**
- `upper_section_label=long` AND `lower_section_label=long`
- `mid_section_label=short`

**해석:** 초·말은 버티나 중년 구간(중정) 리스크 주의하오. 30~50세 사이 건강과 재물 관리에 신경 쓰시오.

---

### MACRO-06: 전반 약세형 (all_weak_unstable)
**조건:**
- `upper_section_label=short` AND `mid_section_label=short` AND `lower_section_label=short`
- `jaw_width_label=narrow`

**해석:** 전체가 빈약하면 기반이 약해 분주·불안정형이오. 한 분야에 집중하고 체력 관리가 중요하오.

---

## 2) 오악(五嶽) MT-01~05

### MT-01: 중심 강세형 (strong_center_weak_others)
**조건:**
- `nose_bridge_label=high`
- `chin_projection_label=recede` OR (`cheekbone_vs_jaw_label=jaw` OR `cheekbone_vs_jaw_label=neutral`)
- `forehead_height_label=low` OR `forehead_height_label=normal`

**해석:** 중심(코)이 강하고 주변이 약하면 주도권이 강한 상이오. 다만 주변 지원이 부족할 수 있으니 협력 관계를 중시하시오.

---

### MT-02: 중심 약세형 (weak_center_strong_others)
**조건:**
- `nose_bridge_label=low`
- (`chin_projection_label=proj` OR `cheekbone_vs_jaw_label=zygoma`)
- `forehead_height_label=high`

**해석:** 중심(코)이 약하고 주변이 강하면 주도권 흔들림형이오. 타인의 의견에 휘둘리기 쉬우니 주관을 세우시오.

---

### MT-03: 중심 비틀림형 (crooked_center_risk)
**조건:**
- `nose_center_label=off` (특히 >0.04)

**해석:** 중악이 비틀리면 중심축이 흔들려 선택 실수 리스크가 있소. 중요한 결정은 신중히 검토하시오.

---

### MT-04: 오악 조화형 (all_mountains_harmonized)
**조건:**
- `nose_bridge_label=high`
- (`chin_projection_label=proj` OR `chin_projection_label=neutral`)
- `cheekbone_vs_jaw_label=neutral`
- `three_section_balanced=true`

**해석:** 오악이 모두 조화롭게 발달한 상이오. 균형 잡힌 운세로 안정적 성공이 가능하리라.

---

### MT-05: 충돌 마찰형 (aggressive_frictive)
**조건:**
- `nose_tip_pointiness_label=sharp`
- `cheekbone_vs_jaw_label=zygoma`

**해석:** 코끝이 예리하고 광대가 세면 충돌·마찰 경향형이오. 대인관계에서 갈등이 생기기 쉬우니 유연함을 기르시오.

---

## 3) 눈-눈썹 EYE-01~06

### EYE-01: 보호막 강한 지략형 (protected_smart_wealth_hold)
**조건:**
- `eye_width_mean=long` (평균)
- `brow_vs_eye_label=brow>eye` (>1.05)

**해석:** 눈이 길고 눈썹이 더 길면 보호막이 커 안정·지략형이오. 재물을 지키는 능력이 뛰어나리라.

---

### EYE-02: 재능 있으나 지원 부족형 (talent_but_support_low)
**조건:**
- `eye_open_mean=open` OR `eye_open_mean=normal`
- `brow_vs_eye_label=<` (<0.95)

**해석:** 재능은 있으나 눈썹이 짧아 지원이 부족한 상이오. 혼자서는 어려우니 협력 관계를 구축하시오.

---

### EYE-03: 눌린 기운형 (pressed_energy_blocked)
**조건:**
- `brow_height_label=low` (미압안)
- `eye_open_mean=narrow` OR `eye_open_mean=neutral`

**해석:** 눈썹이 눈을 누르고 눈이 작으면 기운이 막힌 상이오. 스트레스 관리와 휴식이 중요하오.

---

### EYE-04: 노출 리스크형 (exposed_risky)
**조건:**
- (픽셀 필요) `eye_protrusion_z` 높음 + `brow_density_low`

**해석:** 보호막이 약하면 사건·구설 리스크형이오. (이미지 없으면 판정 불가)

---

### EYE-05: 관계 균열형 (betrayal_separation)
**조건:**
- (픽셀 필요) `brow_brokenness_high`

**해석:** 눈썹 끊김/결손 신호가 강하면 관계 균열형이오. (이미지 없으면 판정 불가)

---

### EYE-06: 고양 기운형 (high_spirit_potential)
**조건:**
- `brow_height_label=high`
- `eye_slope_mean=up` OR `eye_slope_mean=neutral`

**해석:** 눈썹이 높고 눈꼬리가 올라가면 고양 기운형이오. 낙천적이고 기회를 잡는 능력이 있소.

---

## 4) 코-광대 NOSE-01~05

### NOSE-01: 재물 안정형 (stable_wealth_hold)
**조건:**
- `nose_bridge_label=high`
- (`nose_tip_pointiness_label=round` OR `nose_tip_pointiness_label=neutral`)
- `nostril_exposure_proxy=hidden` (픽셀 필요)
- (`cheekbone_vs_jaw_label=neutral` OR `cheekbone_vs_jaw_label=jaw`)

**해석:** 코가 높고 코끝이 둥글며 콧구멍이 덮여 있으면 재물이 안정적으로 모이는 상이오.

---

### NOSE-02: 재물 누수형 (leaky_wealth_risk)
**조건:**
- `nose_bridge_label=high` OR `nose_bridge_label=mid`
- `nostril_exposure_proxy=exposed` (픽셀 필요)

**해석:** 코는 높으나 콧구멍이 훤히 보이면 재물 누수 리스크가 있소. 지출 관리에 신경 쓰시오.

---

### NOSE-03: 재물 기반 취약형 (weak_wealth_poor)
**조건:**
- `nose_bridge_label=low`
- `nostril_exposure_proxy=exposed` (픽셀 필요)
- `cheekbone_width=narrow`

**해석:** 창고도 낮고 담도 약하면 재물 기반 취약형이오. 안정적 수입원 확보가 중요하오.

---

### NOSE-04: 마찰 충돌형 (cunning_conflict)
**조건:**
- `nose_center_label=off`
- `nose_tip_pointiness_label=sharp`
- `cheekbone_vs_jaw_label=zygoma`

**해석:** 코가 비틀리고 예리하며 광대가 세면 마찰형이오. 대인관계에서 갈등이 생기기 쉬우니 신중하시오.

---

### NOSE-05: 손재 경고형 (loss_event_warning)
**조건:**
- (픽셀 필요) `nose_tip_redness=high` OR `nose_bridge_wrinkle_score=high`

**해석:** 붉음/주름 신호가 강하면 손재·병증 경고 플래그이오. 건강과 재물 관리에 주의하시오.

---

## 5) 입 MOUTH-01~05

### MOUTH-01: 신뢰 권위형 (credible_authoritative)
**조건:**
- `mouth_width_label=normal`
- (`mouth_corner_slope=neutral` OR `mouth_corner_slope=up`)
- `lip_balance_label=balanced`

**해석:** 입이 적당하고 입꼬리가 균형이며 입술이 균형 잡혔으면 신뢰·권위형이오. 말이 신뢰를 얻는 상이로다.

---

### MOUTH-02: 고독 구설형 (lonely_gossip_risk)
**조건:**
- `mouth_corner_slope=neutral` OR `mouth_corner_slope=down`
- `philtrum_label=long`
- (추가 시) `mouth_protrusion_z=proj`

**해석:** 입꼬리가 처지고 인중이 길며 입이 돌출되면 고독·구설 리스크가 있소. 말을 가려 하시오.

---

### MOUTH-03: 비관 엄격형 (pessimistic_harsh)
**조건:**
- `mouth_corner_slope=down`
- (픽셀 필요) `lip_redness=dark`

**해석:** 입꼬리 하강+어두운 기색이면 불만·비관 플래그이오. 긍정적 사고 습관을 기르시오.

---

### MOUTH-04: 호감 귀인형 (bright_success_helped)
**조건:**
- `mouth_corner_slope=up`
- (픽셀 필요) `lip_redness=red`

**해석:** 입꼬리 상승+붉은 기색이면 호감·귀인 플래그이오. 사람이 모이고 기회가 따라오리라.

---

### MOUTH-05: 통솔 지휘형 (leader_commanding)
**조건:**
- `mouth_width_label=big`
- `mouth_expression=closed`

**해석:** 입이 크되 다문 프레임이 안정이면 통솔형이오. 리더십과 지휘 능력이 있는 상이로다.

---

## 조합표 사용법

1. **기본 메트릭 계산** → `calculateMetrics()` + `calculateExtendedMetrics()`
2. **라벨 매칭** → 각 feature의 라벨 값 확인
3. **조합 판정** → 위 조건과 매칭하여 결과 태그 선택
4. **해석 생성** → 결과 태그에 해당하는 해석 템플릿 사용

**주의:** 픽셀 기반 조건(기색/점/주름)은 이미지가 없으면 해당 조합을 건너뛰시오.
