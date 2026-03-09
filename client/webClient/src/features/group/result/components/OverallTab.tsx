import React from "react";
import { OverallTabMobile } from "./OverallTabMobile";
import { OverallTabDesktop } from "./OverallTabDesktop";
import type { GroupResultDataSource } from "./GroupResultTypes";
import type { MemberWithRole } from "./GroupResultTypes";

export interface OverallTabProps {
  dataSource: GroupResultDataSource;
  membersWithRoles: MemberWithRole[];
  onRankingClick: () => void;
  hasRegisteredRanking: boolean;
  isMobile: boolean;
}

export const OverallTab: React.FC<OverallTabProps> = ({
  dataSource,
  membersWithRoles,
  onRankingClick,
  hasRegisteredRanking,
  isMobile,
}) =>
  isMobile ? (
    <OverallTabMobile
      dataSource={dataSource}
      membersWithRoles={membersWithRoles}
      onRankingClick={onRankingClick}
      hasRegisteredRanking={hasRegisteredRanking}
    />
  ) : (
    <OverallTabDesktop
      dataSource={dataSource}
      membersWithRoles={membersWithRoles}
      onRankingClick={onRankingClick}
      hasRegisteredRanking={hasRegisteredRanking}
    />
  );
