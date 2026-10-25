import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const axis = { fontSize: 12, fill: '#64748b' };

export function HBar({ data, dataKey = 'count', nameKey = 'skill', color = '#6366f1', height = 300 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
        <XAxis type="number" allowDecimals={false} tick={axis} />
        <YAxis type="category" dataKey={nameKey} width={110} tick={axis} />
        <Tooltip cursor={{ fill: '#f1f5f9' }} />
        <Bar dataKey={dataKey} fill={color} radius={[0, 6, 6, 0]} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function GapBar({ data, height = 300 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="skill" tick={axis} interval={0} angle={-25} textAnchor="end" height={60} />
        <YAxis allowDecimals={false} tick={axis} />
        <Tooltip cursor={{ fill: '#f1f5f9' }} />
        <Legend />
        <Bar dataKey="wanted" name="Want to learn" fill="#f59e0b" radius={[6, 6, 0, 0]} />
        <Bar dataKey="offered" name="Can teach" fill="#10b981" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WeeklyLine({ data, height = 280 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis dataKey="week" tick={axis} />
        <YAxis allowDecimals={false} tick={axis} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="requests" name="Requests" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="accepted" name="Accepted" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
