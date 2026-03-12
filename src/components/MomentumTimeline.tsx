import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import type { MomentumPlay, KeyMoment } from '../types';
import { formatGameTime } from '../utils/momentumEngine';
import './MomentumTimeline.css';

interface MomentumTimelineProps {
  plays: MomentumPlay[];
  keyMoments: KeyMoment[];
  selectedMoment: KeyMoment | null;
  onMomentClick: (moment: KeyMoment) => void;
}

interface ChartDataPoint {
  gameTime: number;
  gameTimeLabel: string;
  momentum: number;
  play: MomentumPlay;
}

export const MomentumTimeline: React.FC<MomentumTimelineProps> = ({
  plays,
  keyMoments,
  selectedMoment,
  onMomentClick,
}) => {
  // Prepare chart data
  const chartData: ChartDataPoint[] = plays.map((play) => ({
    gameTime: play.gameTimeSeconds,
    gameTimeLabel: formatGameTime(play.gameTimeSeconds),
    momentum: play.momentumScore,
    play,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataPoint }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="momentum-tooltip">
          <div className="tooltip-time">{data.gameTimeLabel}</div>
          <div className="tooltip-momentum">Momentum: {data.momentum.toFixed(0)}</div>
          <div className="tooltip-score">
            Score: {data.play.scoreHome} - {data.play.scoreAway}
          </div>
          <div className="tooltip-desc">{data.play.description}</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="momentum-timeline">
      <h2>📈 Momentum Timeline</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="gameTime"
              stroke="#666"
              tickFormatter={(value) => formatGameTime(value)}
              tick={{ fill: '#888', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              stroke="#666"
              tick={{ fill: '#888', fontSize: 12 }}
              label={{ value: 'Momentum', angle: -90, position: 'insideLeft', fill: '#888' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="momentum"
              stroke="#ff6b00"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, fill: '#ff6b00' }}
            />
            {/* Key moment markers */}
            {keyMoments.map((moment) => {
              const isSelected = selectedMoment?.play.id === moment.play.id;
              return (
                <ReferenceDot
                  key={moment.play.id}
                  x={moment.play.gameTimeSeconds}
                  y={moment.play.momentumScore}
                  r={isSelected ? 12 : 8}
                  fill={isSelected ? '#fff' : '#ff6b00'}
                  stroke={isSelected ? '#ff6b00' : '#fff'}
                  strokeWidth={2}
                  onClick={() => onMomentClick(moment)}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="timeline-legend">
        <div className="legend-item">
          <span className="legend-dot active"></span>
          <span>Key Moments (click to view)</span>
        </div>
        <div className="legend-item">
          <span className="legend-line"></span>
          <span>Momentum Score (0-100)</span>
        </div>
      </div>
    </div>
  );
};
