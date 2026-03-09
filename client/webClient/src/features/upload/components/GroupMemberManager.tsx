import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Camera, Pencil, Trash2 } from "lucide-react";
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
import type { GroupMember } from "@/types";

export interface GroupMemberManagerProps {
  members: GroupMember[];
  onUpdateMember: (id: number, patch: Partial<GroupMember>) => void;
  onAvatarUpload: (id: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  onAddMember: () => void;
  onRemoveMember: (id: number) => void;
  maxMembers?: number;
  memberAvatarErrorId?: number | null;
  memberIdAnalyzing?: number | null;
}

export function GroupMemberManager({
  members,
  onUpdateMember,
  onAvatarUpload,
  onAddMember,
  onRemoveMember,
  maxMembers = 7,
  memberAvatarErrorId = null,
  memberIdAnalyzing = null,
}: GroupMemberManagerProps) {
  return (
    <div className="space-y-4 relative z-10">
      <AnimatePresence>
        {members.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start bg-white/60 backdrop-blur-sm p-4 sm:p-5 rounded-2xl border-2 border-gray-100 shadow-md hover:shadow-lg hover:border-brand-orange/40 transition-all duration-300 relative group"
          >
            {members.length > 2 && (
              <button
                type="button"
                onClick={() => onRemoveMember(member.id)}
                className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors p-1.5 hover:bg-red-50 rounded-full z-10"
                title="멤버 삭제"
              >
                <Trash2 size={18} />
              </button>
            )}
            {/* Member Avatar Upload */}
            <div className="shrink-0 flex flex-col items-center sm:items-start">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-lg border-2 border-white bg-gray-50 transition-all duration-300 relative flex items-center justify-center ${member.avatar ? "" : "cursor-pointer hover:scale-105 hover:shadow-xl"}`}
                onClick={() => {
                  if (!member.avatar) {
                    document.getElementById(`avatar-upload-${member.id}`)?.click();
                  }
                }}
              >
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt="Face"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 gap-1.5">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-inner">
                      <Camera size={20} />
                    </div>
                    <span className="text-xs font-bold text-center leading-tight">
                      얼굴 사진
                      <br />
                      비추기
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  id={`avatar-upload-${member.id}`}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => onAvatarUpload(member.id, e)}
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-3 min-w-0 w-full">
              <div className="w-full relative">
                <Input
                  placeholder="이름을 입력하세요. (최대 6글자)"
                  maxLength={6}
                  lang="ko"
                  autoComplete="off"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  data-form-type="other"
                  className="h-10 w-full text-sm bg-white/90 border-2 border-gray-200 focus:bg-white focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all rounded-xl font-semibold pl-3 pr-10 placeholder:text-gray-400 shadow-sm"
                  value={member.name ?? ""}
                  onFocus={() => onUpdateMember(member.id, { name: "" })}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, 6);
                    onUpdateMember(member.id, { name: v });
                  }}
                />
                <Pencil
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                  strokeWidth={2}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start w-full min-w-0">
                <div className="flex flex-col gap-1 w-full min-w-0">
                  <div className="min-h-[1.25rem] flex items-center">
                    <Label className="text-xs font-bold text-gray-700 ml-1">
                      생년월일
                    </Label>
                  </div>
                  <DatePicker
                    value={member.birthDate}
                    onChange={(value) => onUpdateMember(member.id, { birthDate: value })}
                    placeholder="YYYY.MM.DD"
                    themeColor="orange"
                    className="w-full"
                    maxDate={new Date()}
                  />
                </div>
                <div className="flex flex-col gap-1 w-full min-w-0">
                  <div className="min-h-[1.25rem] flex items-center">
                    <Label className="text-xs font-bold text-gray-700 ml-1">
                      성별
                    </Label>
                  </div>
                  <ToggleGroup
                    type="single"
                    value={member.gender}
                    onValueChange={(val) =>
                      val && onUpdateMember(member.id, { gender: val as "male" | "female" })
                    }
                    variant="outline"
                    className="w-full [&>button]:h-10"
                  >
                    <ToggleGroupItem
                      value="male"
                      className="flex-1 text-xs font-bold"
                    >
                      남성
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="female"
                      className="flex-1 text-xs font-bold"
                    >
                      여성
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>

              <div className="flex flex-col gap-1 w-full min-w-0">
                <div className="flex justify-between items-center min-h-[1.25rem]">
                  <Label className="text-xs font-bold text-gray-700 ml-1">
                    태어난 시간
                  </Label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <Checkbox
                      checked={member.birthTimeUnknown || false}
                      onCheckedChange={(checked) => {
                        const isChecked = checked === true;
                        onUpdateMember(member.id, {
                          birthTimeUnknown: isChecked,
                          birthTime: isChecked ? "" : "00:00",
                        });
                      }}
                    />
                    <span className="text-sm font-medium text-gray-600 group-hover:text-brand-orange transition-colors">
                      모름
                    </span>
                  </label>
                </div>
                {!member.birthTimeUnknown ? (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full min-w-0 max-w-full sm:max-w-[280px]">
                    <div className="relative min-w-0">
                      <Select
                        value={
                          member.birthTime
                            ? parseInt(member.birthTime.split(":")[0], 10).toString()
                            : "0"
                        }
                        onValueChange={(value) => {
                          const currentTime = member.birthTime || "00:00";
                          const [, minutes] = currentTime.split(":");
                          const h = value.padStart(2, "0");
                          onUpdateMember(member.id, {
                            birthTime: `${h}:${minutes}`,
                          });
                        }}
                      >
                        <SelectTrigger className="bg-white/50 border-2 border-gray-100 focus:border-brand-orange shadow-inner h-9 rounded-lg transition-all pl-8 pr-3 text-sm w-full min-w-0 [&>span]:!line-clamp-none">
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

                    <div className="relative min-w-0 flex-1">
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="00"
                        maxLength={2}
                        value={(() => {
                          const raw = member.birthTime ?? "";
                          if (!raw) return "";
                          const parts = raw.split(":");
                          const minutes = parts[1] ?? "";
                          return String(minutes);
                        })()}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(0, 2);
                          const currentTime = member.birthTime || "00:00";
                          const [hours] = currentTime.split(":");
                          if (v === "") {
                            onUpdateMember(member.id, {
                              birthTime: hours ? `${hours}:` : "",
                            });
                          } else {
                            const num = parseInt(v, 10);
                            const clamped = num > 59 ? "59" : v;
                            onUpdateMember(member.id, {
                              birthTime: `${hours}:${clamped}`,
                            });
                          }
                        }}
                        onBlur={() => {
                          const currentTime = member.birthTime || "00:00";
                          const [hours, min] = currentTime.split(":");
                          if (min === undefined || min === "") {
                            onUpdateMember(member.id, {
                              birthTime: `${hours || "00"}:00`,
                            });
                          } else {
                            const parsed = parseInt(min || "0", 10);
                            const clamped = Math.min(
                              59,
                              Math.max(0, isNaN(parsed) ? 0 : parsed)
                            )
                              .toString()
                              .padStart(2, "0");
                            if (min !== clamped) {
                              onUpdateMember(member.id, {
                                birthTime: `${hours}:${clamped}`,
                              });
                            }
                          }
                        }}
                        className="bg-white/50 border-2 border-gray-100 focus:border-brand-orange shadow-inner h-9 rounded-lg transition-all w-full min-w-0 text-sm pl-3 pr-9"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                        분
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full min-w-0">
                    <div className="bg-gray-100/50 border-2 border-gray-100 h-9 rounded-lg flex items-center pl-9 text-gray-400 text-sm w-full">
                      시간 정보 없음
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {members.length < maxMembers && (
        <button
          type="button"
          onClick={onAddMember}
          className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:border-brand-orange hover:text-brand-orange hover:bg-orange-50/50 transition-all flex items-center justify-center gap-2 font-bold text-sm"
        >
          <Users size={20} />
          멤버 추가하기
        </button>
      )}
    </div>
  );
}
