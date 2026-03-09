import React from "react";
import { getCircleAngles, ROLE_STYLE_MAP } from "./GroupResultTypes";
import type { MemberWithRole } from "./GroupResultTypes";

const BLUE_GRADIENT = "blueGradient";
const ORANGE_GRADIENT = "orangeGradient";

export interface OverallDiagramSectionProps {
  membersWithRoles: MemberWithRole[];
  /** 데스크톱에서는 키워드 라벨 표시 */
  showKeywords?: boolean;
  /** SVG defs/clipPath id 충돌 방지 (예: "mobile", "desktop") */
  idPrefix?: string;
  /** 모바일: max-w 작게, 데스크톱: max-w-md */
  maxWidthClass?: string;
}

export const OverallDiagramSection: React.FC<OverallDiagramSectionProps> = ({
  membersWithRoles,
  showKeywords = false,
  idPrefix = "overall",
  maxWidthClass = "max-w-[min(260px,100%)]",
}) => {
  const count = Math.min(7, Math.max(2, membersWithRoles.length));
  const angles = getCircleAngles(count);
  const radius = count >= 6 ? 115 : 120;
  const nodeR = count >= 6 ? 30 : 35;
  const avatarR = count >= 6 ? 26 : 32;
  const keywordRadius = radius + (count >= 6 ? 20 : 25);
  const keywordFontSize = count >= 6 ? 10 : 12;
  const keywordRectW = count >= 6 ? 54 : 62;
  const keywordRectH = count >= 6 ? 18 : 20;
  const displayMembers = membersWithRoles.slice(0, count);
  const centerX = 200;
  const centerY = 200;

  const g = (name: string) => `${name}-${idPrefix}`;

  return (
    <div className={`relative w-full aspect-square ${maxWidthClass} mx-auto`}>
      <svg className="w-full h-full" viewBox="0 0 400 400">
        <defs>
          <linearGradient id={g("leaderGradient")} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id={g("centerGradient")} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9CA3AF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6B7280" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={g("balanceGradient")} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={g("mediatorGradient")} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={g("energyGradient")} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F87171" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id={g(BLUE_GRADIENT)} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={g(ORANGE_GRADIENT)} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FB923C" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke={`url(#${g(BLUE_GRADIENT)})`} strokeWidth="2" strokeDasharray="5,5" opacity="0.4" />
        {angles.map((_, i) => {
          const nextIdx = (i + 1) % count;
          const x1 = centerX + radius * Math.cos(angles[i]);
          const y1 = centerY + radius * Math.sin(angles[i]);
          const x2 = centerX + radius * Math.cos(angles[nextIdx]);
          const y2 = centerY + radius * Math.sin(angles[nextIdx]);
          return (
            <line
              key={`line-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={i % 2 === 0 ? `url(#${g(ORANGE_GRADIENT)})` : `url(#${g(BLUE_GRADIENT)})`}
              strokeWidth="2"
              opacity="0.5"
            />
          );
        })}
        {displayMembers.map((member, idx) => {
          const angle = angles[idx];
          const style = ROLE_STYLE_MAP[idx % ROLE_STYLE_MAP.length];
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          const gradId = g(style.gradientId);
          const clipId = `avatar-clip-${idPrefix}-${member.id ?? idx}`;
          const keywords = showKeywords ? (member.keywords || []).slice(0, 2) : [];

          return (
            <g key={member.id ?? idx}>
              <defs>
                <clipPath id={clipId}>
                  <circle cx={x} cy={y} r={avatarR} />
                </clipPath>
              </defs>
              <circle cx={x} cy={y} r={nodeR} fill={`url(#${gradId})`} stroke="white" strokeWidth="3" className="drop-shadow-md" />
              {member.avatar && member.avatar.trim() !== "" ? (
                <image href={member.avatar} x={x - avatarR} y={y - avatarR} width={avatarR * 2} height={avatarR * 2} clipPath={`url(#${clipId})`} className="pointer-events-none" />
              ) : (
                <>
                  <text x={x} y={y - (count >= 6 ? 8 : 10)} textAnchor="middle" fontSize={count >= 6 ? 24 : 28}>
                    {style.badge}
                  </text>
                  <text x={x} y={y + (count >= 6 ? 8 : 10)} textAnchor="middle" fontSize={count >= 6 ? 14 : 16} fontWeight="bold" fill="white" className="font-display">
                    {member.name[0] || "?"}
                  </text>
                </>
              )}
              <text
                x={x}
                y={y + nodeR + (count >= 6 ? 22 : 26)}
                textAnchor="middle"
                fontSize={count >= 6 ? 13 : 14}
                fontWeight="bold"
                fill={style.textColor}
                className="font-sans"
              >
                {style.shortLabel}
              </text>
              {keywords.map((keyword, kIdx) => {
                const keywordAngle = angle + (kIdx - 0.5) * 0.35;
                const kx = centerX + keywordRadius * Math.cos(keywordAngle);
                const ky = centerY + keywordRadius * Math.sin(keywordAngle);
                return (
                  <g key={kIdx}>
                    <rect
                      x={kx - keywordRectW / 2}
                      y={ky - keywordRectH / 2}
                      width={keywordRectW}
                      height={keywordRectH}
                      rx="6"
                      fill="white"
                      stroke={style.textColor}
                      strokeWidth="1.5"
                      opacity="0.9"
                      className="drop-shadow-sm"
                    />
                    <text x={kx} y={ky + (count >= 6 ? 4 : 5)} textAnchor="middle" fontSize={keywordFontSize} fill={style.textColor} className="font-sans font-medium">
                      {keyword.length > 6 ? keyword.slice(0, 5) + "…" : keyword}
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
