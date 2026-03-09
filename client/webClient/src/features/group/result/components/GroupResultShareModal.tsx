import React from "react";
import { Modal, ModalHeader, ModalBody } from "@/components/ui/core/Modal";
import { ActionButton } from "@/components/ui/core/ActionButton";

export interface GroupResultShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    shareUrl: string;
    qrCodeUrl: string;
    onCopyLink: () => void;
}

export const GroupResultShareModal: React.FC<GroupResultShareModalProps> = ({
    isOpen,
    onClose,
    shareUrl,
    qrCodeUrl,
    onCopyLink,
}) => (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalHeader description="QR 코드를 스캔하거나 링크를 공유하세요">
            결과 공유하기
        </ModalHeader>
        <ModalBody>
            <div className="flex flex-col items-center gap-6">
                <div className="bg-white p-4 rounded-2xl shadow-clay-sm border-4 border-brand-orange-muted">
                    <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className="w-48 h-48"
                    />
                </div>
                <p className="text-sm text-gray-500 text-center">
                    QR 코드를 스캔하면 결과 페이지로 이동합니다
                </p>
                <div className="flex gap-3 w-full">
                    <ActionButton
                        variant="secondary"
                        onClick={onCopyLink}
                        className="flex-1 flex items-center justify-center gap-2"
                    >
                        링크 복사
                    </ActionButton>
                </div>
            </div>
        </ModalBody>
    </Modal>
);
