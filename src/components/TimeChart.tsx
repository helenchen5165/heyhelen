"use client";
import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TimeLogSummary } from '@/types';

export default function TimeChart({ data }: { data: TimeLogSummary[] }) {
  // 按日期聚合
  const grouped = data.reduce((acc: Record<string, number>, cur: TimeLogSummary) => {
    const date = cur.date?.slice(0, 10);
    acc[date] = (acc[date] || 0) + cur.hours;
    return acc;
  }, {});
  const chartData = Object.entries(grouped).map(([date, hours]) => ({ date, hours }));

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip />
        <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
} 