"use client";
import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, RadialBarChart, RadialBar } from "recharts";

const COLORS = ["#60a5fa", "#34d399", "#f87171"];

export default function TimePage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/time/summary")
      .then(res => res.json())
      .then(data => {
        setSummary(data.summary);
        setLoading(false);
      });
  }, []);

  if (loading || !summary) return <div className="min-h-screen flex items-center justify-center text-gray-500">加载中...</div>;

  const pieData = [
    { name: "生产", value: summary.production },
    { name: "投资", value: summary.investment },
    { name: "支出", value: summary.expense },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-12">
      <h1 className="text-2xl font-bold mb-8 text-black">本周时间记录可视化</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {/* 饼图 */}
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center">
          <h2 className="text-lg font-bold mb-4 text-black">本周时间分布</h2>
          <PieChart width={240} height={220}>
            <Pie data={pieData} cx={120} cy={110} innerRadius={50} outerRadius={80} fill="#8884d8" dataKey="value" label>
              {pieData.map((entry, idx) => <Cell key={entry.name} fill={COLORS[idx]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
        {/* 效率仪表盘 */}
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center">
          <h2 className="text-lg font-bold mb-4 text-black">本周效率</h2>
          <RadialBarChart width={200} height={200} innerRadius={80} outerRadius={100} data={[{ name: '效率', value: summary.efficiency }]}> 
            <RadialBar background dataKey="value" fill="#60a5fa" cornerRadius={10} />
            <text x={100} y={110} textAnchor="middle" dominantBaseline="middle" className="text-3xl font-bold text-blue-600">{summary.efficiency}%</text>
          </RadialBarChart>
        </div>
        {/* 日均时长卡片 */}
        <div className="bg-white rounded-2xl shadow p-6 flex flex-col items-center justify-center">
          <h2 className="text-lg font-bold mb-4 text-black">日均时长</h2>
          <div className="flex gap-4 w-full">
            <div className="bg-blue-50 rounded-xl p-4 flex-1 text-center">
              <div className="text-2xl font-bold text-blue-600">{(summary.production / 7).toFixed(1)}h</div>
              <div className="text-gray-500">生产</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 flex-1 text-center">
              <div className="text-2xl font-bold text-green-600">{(summary.investment / 7).toFixed(1)}h</div>
              <div className="text-gray-500">投资</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 flex-1 text-center">
              <div className="text-2xl font-bold text-red-600">{(summary.expense / 7).toFixed(1)}h</div>
              <div className="text-gray-500">支出</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 