"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatNumber } from "@/lib/format";

type StockFlowData = {
  label: string;
  incoming: number;
  outgoing: number;
};

export function StockFlowChart({ data }: { data: StockFlowData[] }) {
  return (
    <div className="h-[230px] w-full sm:h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="incoming" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e79d34" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#f2b233" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="outgoing" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e58fb4" stopOpacity={0.36} />
              <stop offset="95%" stopColor="#e885b4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e7cfab" strokeDasharray="4 6" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#8b684a" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: "#8b684a" }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "1px solid #ecd2ad",
              background: "#fff8ef",
              boxShadow: "0 18px 36px -24px rgba(71,43,28,0.45)",
            }}
            formatter={(value) => formatNumber(typeof value === "number" ? value : Number(value ?? 0))}
          />
          <Area type="monotone" dataKey="incoming" stroke="#d58f25" strokeWidth={3} fill="url(#incoming)" />
          <Area type="monotone" dataKey="outgoing" stroke="#cc739c" strokeWidth={3} fill="url(#outgoing)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

