import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Users, Skull, Trophy, Clock } from 'lucide-react';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const playData = [
  { day: 'Mon', plays: 45 },
  { day: 'Tue', plays: 62 },
  { day: 'Wed', plays: 38 },
  { day: 'Thu', plays: 89 },
  { day: 'Fri', plays: 124 },
  { day: 'Sat', plays: 156 },
  { day: 'Sun', plays: 142 },
];

const retentionData = [
  { stage: 'Started', players: 100 },
  { stage: 'Level 1', players: 85 },
  { stage: 'Level 2', players: 62 },
  { stage: 'Level 3', players: 41 },
  { stage: 'Completed', players: 28 },
];

const deathData = [
  { name: 'Spikes', value: 42, color: '#94A3B8' },
  { name: 'Lava', value: 28, color: '#EF4444' },
  { name: 'Enemies', value: 22, color: '#22C55E' },
  { name: 'Falls', value: 8, color: '#0EA5E9' },
];

export const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-surface-1 border-surface-2 text-foreground sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Game Analytics</DialogTitle>
        </DialogHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="p-4 bg-surface-2 rounded-lg">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Users className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">Total Plays</span>
            </div>
            <p className="text-2xl font-bold">656</p>
          </div>
          <div className="p-4 bg-surface-2 rounded-lg">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <Skull className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">Total Deaths</span>
            </div>
            <p className="text-2xl font-bold">2,341</p>
          </div>
          <div className="p-4 bg-surface-2 rounded-lg">
            <div className="flex items-center gap-2 text-amber mb-2">
              <Trophy className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">Completions</span>
            </div>
            <p className="text-2xl font-bold">184</p>
          </div>
          <div className="p-4 bg-surface-2 rounded-lg">
            <div className="flex items-center gap-2 text-cyan mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm text-muted-foreground">Avg. Time</span>
            </div>
            <p className="text-2xl font-bold">4:32</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {/* Plays Chart */}
          <div className="p-4 bg-surface-2 rounded-lg">
            <h3 className="text-sm font-medium mb-4">Plays This Week</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={playData}>
                <XAxis dataKey="day" stroke="#64748B" fontSize={12} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="plays" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Retention Chart */}
          <div className="p-4 bg-surface-2 rounded-lg">
            <h3 className="text-sm font-medium mb-4">Player Retention</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={retentionData}>
                <XAxis dataKey="stage" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="players"
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  dot={{ fill: '#0EA5E9' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Death Causes */}
        <div className="p-4 bg-surface-2 rounded-lg mt-4">
          <h3 className="text-sm font-medium mb-4">Death Causes</h3>
          <div className="flex items-center gap-8">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie
                  data={deathData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {deathData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {deathData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          Analytics data is simulated for demonstration purposes
        </p>
      </DialogContent>
    </Dialog>
  );
};
