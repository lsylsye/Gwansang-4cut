import React, { useState } from "react";
import { Modal, ModalHeader, ModalBody } from "@/shared/ui/core/Modal";
import { ActionButton } from "@/shared/ui/core/ActionButton";
import { Checkbox } from "@/shared/ui/forms/checkbox";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgree: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({
  isOpen,
  onClose,
  onAgree,
}) => {
  const [isAgreed, setIsAgreed] = useState(false);

  const handleAgree = () => {
    if (isAgreed) {
      onAgree();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader description="서비스 이용을 위해 동의가 필요합니다">
        <div className="flex items-center justify-center gap-3 mb-2">
          <CheckCircle2 className="w-6 h-6 text-brand-green" />
          <span className="text-2xl font-bold text-gray-900 font-display">
            사진 데이터 사용 동의
          </span>
        </div>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-6">
          {/* 개인정보 처리 방침 */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-gray-800 font-display">
              개인정보 처리 방침
            </h4>

            <div className="space-y-3 text-sm text-gray-700 font-sans">
              <div>
                <h5 className="font-bold text-gray-800 mb-1">1. 수집하는 정보:</h5>
                <p className="text-gray-600 ml-4">
                  - 촬영된 얼굴 사진 (관상 분석 목적으로만 사용)
                </p>
              </div>

              <div>
                <h5 className="font-bold text-gray-800 mb-1">2. 사용 목적:</h5>
                <p className="text-gray-600 ml-4">
                  - 관상 분석 서비스 제공
                </p>
                <p className="text-gray-600 ml-4">
                  - 분석 결과 생성
                </p>
              </div>

              <div>
                <h5 className="font-bold text-gray-800 mb-1">3. 보관 및 폐기:</h5>
                <p className="text-gray-600 ml-4">
                  - 분석 완료 후 즉시 폐기
                </p>
                <p className="text-gray-600 ml-4">
                  - 서버에 저장되지 않음
                </p>
                <p className="text-gray-600 ml-4">
                  - 로컬에서만 임시 처리
                </p>
              </div>

              <div>
                <h5 className="font-bold text-gray-800 mb-1">4. 제3자 제공:</h5>
                <p className="text-gray-600 ml-4">
                  - 어떠한 경우에도 제3자에게 제공하지 않음
                </p>
              </div>
            </div>
          </div>

          {/* 중요 안내 */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 flex gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700 font-sans leading-relaxed">
              <span className="font-bold text-yellow-700">중요:</span> 업로드된 사진은 분석 후 즉시 폐기되며, 서버에 저장되지 않습니다. 안심하고 이용하세요.
            </p>
          </div>

          {/* 동의 체크박스 */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox
                checked={isAgreed}
                onCheckedChange={(checked) => setIsAgreed(checked === true)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800 font-sans">
                  위 내용을 확인하였으며, 사진 데이터 사용에 동의합니다.
                </p>
                <p className="text-xs text-gray-500 mt-1 font-sans">
                  (필수) 동의하지 않을 경우 서비스를 이용하실 수 없습니다.
                </p>
              </div>
            </label>
          </div>

          {/* 동의 버튼 */}
          <ActionButton
            variant="primary"
            onClick={handleAgree}
            disabled={!isAgreed}
            className={`w-full py-5 text-lg font-bold flex items-center justify-center gap-2 ${
              !isAgreed ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <CheckCircle2 size={20} />
            동의하고 시작하기
          </ActionButton>
        </div>
      </ModalBody>
    </Modal>
  );
};
