"use client";
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

type TimeSummary = {
  total: number;
  recorded: number;
  efficiency: number;
  production: number;
  investment: number;
  expense: number;
  unrecorded: number;
};
type TimeDayData = {
  date: string;
  production: number;
  investment: number;
  expense: number;
  unutilized: number;
};

// data: [{ date: string, duration: number }]
export default function TimeChart({ data }: { data: any[] }) {
  // 按日期聚合
  const grouped = data.reduce((acc: any, cur: any) => {
    const date = cur.date?.slice(0, 10);
    acc[date] = (acc[date] || 0) + cur.duration;
    return acc;
  }, {});
  const chartData = Object.entries(grouped).map(([date, duration]) => ({ date, duration }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip />
        <Bar dataKey="duration" fill="#6366f1" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
} 