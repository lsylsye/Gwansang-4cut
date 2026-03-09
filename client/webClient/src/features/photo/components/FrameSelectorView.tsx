import React from "react";
import { motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/core/card";
import { ActionButton } from "@/components/ui/core/ActionButton";
import film01 from "@/assets/film_01.png";
import film02 from "@/assets/film_02.png";

export type FrameType = "vertical" | "horizontal";

export interface FrameSelectorViewProps {
  onSelectFrame: (type: FrameType) => void;
  onBack: () => void;
}

export const FrameSelectorView: React.FC<FrameSelectorViewProps> = ({ onSelectFrame, onBack }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    className="w-full max-w-4xl mx-auto py-12 px-4"
  >
    <div className="text-center mb-12">
      <h2 className="text-4xl font-extrabold font-display mb-4 text-gray-900 tracking-tight">
        프레임 선택하기
      </h2>
      <div className="h-1 w-20 bg-brand-green/30 mx-auto rounded-full" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
      <motion.div whileHover={{ y: -12, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex h-full">
        <Card
          className="flex-1 cursor-pointer overflow-hidden border-2 border-transparent hover:border-[#BFE7FF] shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:shadow-md transition-all duration-500 rounded-[2.5rem] flex flex-col items-center p-10 bg-white hover:bg-white/90 group"
          onClick={() => onSelectFrame("vertical")}
        >
          <div className="w-full aspect-[4/3] mb-8 rounded-3xl bg-white border border-gray-100 flex items-center justify-center group-hover:bg-gray-50 transition-colors overflow-hidden p-6">
            <img src={film01} alt="세로 프레임" className="h-full w-auto object-contain transform group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="text-center w-full px-2">
            <h3 className="text-2xl font-bold text-gray-900 font-display mb-3 whitespace-nowrap tracking-tight">세로 프레임</h3>
            <p className="text-gray-500 leading-relaxed font-hand text-base sm:text-lg break-keep">
              클래식한 4컷 세로 레이아웃입니다.<br />1~2인 촬영에 가장 추천해 드려요.
            </p>
          </div>
        </Card>
      </motion.div>

      <motion.div whileHover={{ y: -12, scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex h-full">
        <Card
          className="flex-1 cursor-pointer overflow-hidden border-2 border-transparent hover:border-[#D9D9D9] shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:shadow-md transition-all duration-500 rounded-[2.5rem] flex flex-col items-center p-10 bg-white hover:bg-white/90 group"
          onClick={() => onSelectFrame("horizontal")}
        >
          <div className="w-full aspect-[4/3] mb-8 rounded-3xl bg-white border border-gray-100 flex items-center justify-center group-hover:bg-gray-50 transition-colors overflow-hidden p-6">
            <img src={film02} alt="가로 프레임" className="w-full h-auto object-contain transform group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="text-center w-full px-2">
            <h3 className="text-2xl font-bold text-gray-900 font-display mb-3 whitespace-nowrap tracking-tight">가로 프레임</h3>
            <p className="text-gray-500 leading-relaxed font-hand text-base sm:text-lg break-keep">
              단체 촬영에 적합한 와이드 프레임입니다.<br />나만의 커스텀 문구 설정이 가능해요.
            </p>
          </div>
        </Card>
      </motion.div>
    </div>

    <div className="flex justify-center">
      <ActionButton variant="secondary" onClick={onBack} className="flex items-center gap-2">
        <ArrowLeft size={20} />
        이전 단계로
      </ActionButton>
    </div>
  </motion.div>
);
