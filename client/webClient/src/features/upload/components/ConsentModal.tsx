import React, { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/shared/ui/core/Modal";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { Checkbox } from "@/shared/ui/forms/checkbox";
import { CheckCircle2, ChevronDown, Shield, Trash2, Eye, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
}

interface ConsentItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  details: string[];
  isChecked: boolean;
  onCheck: (checked: boolean) => void;
  isRequired?: boolean;
}

const ConsentItem: React.FC<ConsentItemProps> = ({
  icon,
  title,
  description,
  details,
  isChecked,
  onCheck,
  isRequired = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-2 border-gray-100 rounded-2xl overflow-hidden bg-white/80 hover:border-gray-200 transition-colors">
      {/* 메인 체크 영역 */}
      <div className="p-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={isChecked}
            onCheckedChange={(checked) => onCheck(checked === true)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-brand-green">{icon}</span>
              <span className="font-bold text-gray-800 font-sans text-sm">
                {title}
              </span>
              {isRequired && (
                <span className="text-xs text-brand-orange font-bold">(필수)</span>
              )}
            </div>
            <p className="text-xs text-gray-500 font-sans">
              {description}
            </p>
          </div>
        </label>
      </div>

      {/* 상세 내용 토글 */}
      <div className="border-t border-gray-100">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <span>자세히 보기</span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} />
          </motion.div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-1.5">
                {details.map((detail, index) => (
                  <p key={index} className="text-xs text-gray-600 font-sans flex items-start gap-2">
                    <span className="text-brand-green mt-0.5">•</span>
                    <span>{detail}</span>
                  </p>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
  onAgree,
}) => {
  const [consent1, setConsent1] = useState(false); // 사진 수집 동의
  const [consent2, setConsent2] = useState(false); // 분석 목적 사용 동의
  const [consent3, setConsent3] = useState(false); // 즉시 폐기 동의

  const allAgreed = consent1 && consent2 && consent3;

  const handleAgreeAll = () => {
    const newState = !allAgreed;
    setConsent1(newState);
    setConsent2(newState);
    setConsent3(newState);
  };

  const handleAgree = () => {
    if (allAgreed) {
      onAgree();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader description="">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-brand-green" />
          </div>
          <span className="text-xl font-bold text-gray-900 font-display">
            개인정보 수집 동의
          </span>
          <p className="text-sm text-gray-500 font-sans text-center">
            서비스 이용을 위해 아래 항목에 동의해 주세요
          </p>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-4">
          {/* 전체 동의 */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <Checkbox
                checked={allAgreed}
                onCheckedChange={handleAgreeAll}
              />
              <span className="font-bold text-gray-800 font-sans">
                전체 동의하기
              </span>
            </label>
          </div>

          {/* 개별 동의 항목 */}
          <div className="space-y-3">
            <ConsentItem
              icon={<Eye size={18} />}
              title="얼굴 특징점 데이터 수집 동의"
              description="MediaPipe를 통해 얼굴 특징점을 수치화하여 수집합니다"
              details={[
                "수집 항목: 얼굴 특징점 좌표 데이터 (수치화된 값)",
                "수집 방법: MediaPipe AI가 실시간으로 얼굴을 분석하여 특징점 추출",
                "사진 미저장: 촬영된 사진 원본은 저장되지 않으며, 수치 데이터만 활용",
                "DB 미저장: 얼굴 특징점 데이터는 데이터베이스에 저장되지 않습니다",
              ]}
              isChecked={consent1}
              onCheck={setConsent1}
            />

            <ConsentItem
              icon={<CheckCircle2 size={18} />}
              title="분석 목적 사용 동의"
              description="수집된 특징점 데이터를 AI 관상 분석에 활용합니다"
              details={[
                "사용 목적: AI 기반 관상 분석 서비스 제공",
                "분석 내용: 얼굴 특징점 수치 기반 관상학적 해석 생성",
                "분석 결과: 성격, 운세, 궁합 등 관상 정보 제공",
                "마케팅, 광고, 프로파일링 등 분석 외 목적으로는 절대 사용하지 않습니다",
                "사용자 동의 없이 AI 학습 데이터로 활용하지 않습니다",
              ]}
              isChecked={consent2}
              onCheck={setConsent2}
            />

            <ConsentItem
              icon={<Trash2 size={18} />}
              title="분석 결과 24시간 보관 동의"
              description="관상 분석 결과는 24시간 후 자동으로 폐기됩니다"
              details={[
                "보관 기간: 분석 결과 생성 후 24시간",
                "보관 목적: 사용자가 결과를 다시 확인할 수 있도록 임시 보관",
                "자동 폐기: 24시간 경과 시 분석 결과 자동 삭제",
                "제3자 제공: 어떠한 경우에도 외부 업체, 기관에 데이터를 제공하지 않습니다",
                "사진 원본: 촬영된 사진은 분석 즉시 폐기되며 서버에 저장되지 않습니다",
              ]}
              isChecked={consent3}
              onCheck={setConsent3}
            />
          </div>

          {/* 안내 문구 */}
          <div className="flex items-center gap-2 p-3 bg-brand-green/5 rounded-xl mb-4 sm:mb-0">
            <Lock size={16} className="text-brand-green shrink-0" />
            <p className="text-xs text-gray-600 font-sans">
              동의하지 않을 경우 서비스 이용이 제한됩니다
            </p>
          </div>
        </div>
      </ModalBody>

      {/* 동의 버튼 - 모바일에서 하단 고정 */}
      <ModalFooter>
        <ActionButton
          variant="primary"
          onClick={handleAgree}
          disabled={!allAgreed}
          className={`w-full py-4 text-base font-bold flex items-center justify-center gap-2 ${
            !allAgreed ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <CheckCircle2 size={18} />
          동의하고 시작하기
        </ActionButton>
      </ModalFooter>
    </Modal>
  );
};
