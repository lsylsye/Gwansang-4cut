import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

import { GlassCard } from "@/shared/ui/core/GlassCard";

interface ChartProps {
  data: {
    subject: string;
    A: number;
    fullMark: number;
  }[];
}

export const ResultCharts: React.FC<ChartProps> = ({ data }) => {
  return (
    <GlassCard className="w-full flex flex-col items-center justify-center p-2">
      <h3 className="text-gray-900 font-bold mb-2">운세 오각형</h3>
      <div className="w-full h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#90A4AE" strokeWidth={1} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "#37474F", fontSize: 12, fontWeight: "bold" }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="My Luck"
              dataKey="A"
              stroke="#00897B"
              strokeWidth={3}
              fill="#26A69A"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};
