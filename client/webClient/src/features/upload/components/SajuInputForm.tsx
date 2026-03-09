import React from "react";
import { motion } from "motion/react";
import { Calendar, Clock, Sparkles } from "lucide-react";
import { GlassCard } from "@/components/ui/core/GlassCard";
import { ActionButton } from "@/components/ui/core/ActionButton";
import { Checkbox } from "@/components/ui/forms/checkbox";
import { Label } from "@/components/ui/forms/label";
import { Input } from "@/components/ui/forms/input";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/forms/toggle-group";
import { DatePicker } from "@/components/ui/forms/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/forms/select";
import type { SajuData } from "@/types";

export interface SajuInputFormProps {
  value: SajuData;
  onChange: (data: SajuData) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

export function SajuInputForm({
  value: sajuData,
  onChange: setSajuData,
  onSubmit,
  isSubmitting = false,
}: SajuInputFormProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-6xl mx-auto pb-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-display">
            사주 정보 입력
          </h2>
          <p className="text-lg text-gray-600 font-sans">
            더 정확한 관상 분석을 위해 사주 정보를 입력해주세요
          </p>
        </div>

        <div className="w-full max-w-lg mx-auto">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-brand-orange" />
              <h3 className="text-xl font-bold text-gray-800 font-display">
                사주 정보 입력 (필수)
              </h3>
            </div>

            <div className="space-y-6">
              {/* Gender Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-600">
                  성별
                </Label>
                <ToggleGroup
                  type="single"
                  value={sajuData.gender}
                  onValueChange={(val) =>
                    val &&
                    setSajuData({ ...sajuData, gender: val as "male" | "female" })
                  }
                  variant="outline"
                  className="w-full"
                >
                  <ToggleGroupItem
                    value="male"
                    className="flex-1 text-sm font-bold"
                  >
                    남성
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="female"
                    className="flex-1 text-sm font-bold"
                  >
                    여성
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Calendar Type */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-600">
                  양력/음력
                </Label>
                <ToggleGroup
                  type="single"
                  value={sajuData.calendarType}
                  onValueChange={(val) =>
                    val &&
                    setSajuData({
                      ...sajuData,
                      calendarType: val as "solar" | "lunar",
                    })
                  }
                  variant="outline"
                  className="w-full"
                >
                  <ToggleGroupItem
                    value="solar"
                    className="flex-1 text-sm font-bold"
                  >
                    양력
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="lunar"
                    className="flex-1 text-sm font-bold"
                  >
                    음력
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Birth Date */}
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-600">
                  생년월일
                </Label>
                <DatePicker
                  value={sajuData.birthDate}
                  onChange={(value) => setSajuData({ ...sajuData, birthDate: value })}
                  placeholder="YYYY.MM.DD"
                  themeColor="orange"
                />
              </div>

              {/* Birth Time */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-bold text-gray-600">
                    태어난 시간
                  </Label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <Checkbox
                      checked={sajuData.birthTimeUnknown || false}
                      onCheckedChange={(checked) => {
                        setSajuData({
                          ...sajuData,
                          birthTimeUnknown: checked === true,
                          birthTime: checked === true ? "" : "",
                        });
                      }}
                    />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-brand-orange transition-colors">
                      모름
                    </span>
                  </label>
                </div>
                {!sajuData.birthTimeUnknown ? (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-full sm:max-w-[320px]">
                    <div className="relative min-w-0">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-orange pointer-events-none z-10" />
                      <Select
                        value={
                          sajuData.birthTime
                            ? (() => {
                                const hours = sajuData.birthTime.split(":")[0];
                                return hours ? parseInt(hours, 10).toString() : "0";
                              })()
                            : "0"
                        }
                        onValueChange={(value) => {
                          const currentTime = sajuData.birthTime || "";
                          const [, minutes] = currentTime.split(":");
                          const h = value.padStart(2, "0");
                          setSajuData({
                            ...sajuData,
                            birthTime: `${h}:${minutes || ""}`,
                          });
                        }}
                      >
                        <SelectTrigger className="bg-white/80 border-2 border-gray-100 focus:border-brand-orange shadow-inner h-10 rounded-lg transition-all pl-9 pr-3 text-sm w-full min-w-0">
                          <SelectValue placeholder="시" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                            <SelectItem key={hour} value={hour.toString()}>
                              {hour}시
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="relative w-full min-w-0">
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="00"
                        maxLength={2}
                        value={
                          sajuData.birthTime
                            ? sajuData.birthTime.split(":")[1] || ""
                            : ""
                        }
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                          const currentTime = sajuData.birthTime || "";
                          const [hours = "00"] = currentTime.split(":");
                          if (v === "") {
                            setSajuData({
                              ...sajuData,
                              birthTime: hours ? `${hours}:` : "",
                            });
                          } else {
                            const num = parseInt(v, 10);
                            const clamped = num > 59 ? "59" : v;
                            setSajuData({
                              ...sajuData,
                              birthTime: `${hours}:${clamped}`,
                            });
                          }
                        }}
                        onBlur={() => {
                          const currentTime = sajuData.birthTime || "";
                          if (!currentTime) return;
                          const [hours, min] = currentTime.split(":");
                          if (min === undefined || min === "") {
                            setSajuData({
                              ...sajuData,
                              birthTime: `${hours || "00"}:00`,
                            });
                          } else {
                            const parsed = parseInt(min, 10);
                            const clamped = Math.min(59, Math.max(0, isNaN(parsed) ? 0 : parsed)).toString().padStart(2, "0");
                            if (min !== clamped) {
                              setSajuData({
                                ...sajuData,
                                birthTime: `${hours || "00"}:${clamped}`,
                              });
                            }
                          }
                        }}
                        className="bg-white/80 border-2 border-gray-100 focus:border-brand-orange shadow-inner h-10 rounded-lg transition-all w-full min-w-0 text-sm pl-3 pr-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                        분
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full min-w-0">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none z-10" />
                    <div className="bg-gray-100/50 border-2 border-gray-100 h-10 rounded-lg flex items-center pl-9 text-gray-400 text-sm">
                      시간 정보 없음
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="mt-8 flex justify-center">
          <ActionButton
            variant="primary"
            onClick={onSubmit}
            disabled={!sajuData.birthDate || isSubmitting}
            className={`px-12 py-5 text-lg font-bold flex items-center gap-2 transition-all duration-300 ${
              !sajuData.birthDate || isSubmitting ? "opacity-50 grayscale cursor-not-allowed" : "animate-bounce-subtle"
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                풀이 받는 중...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                거북 도사님께 풀이 받기
              </>
            )}
          </ActionButton>
        </div>
      </motion.div>
    </div>
  );
}
