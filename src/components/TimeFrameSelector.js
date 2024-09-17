// src/components/TimeFrameSelector.js
import React from 'react';
import { Button } from '@/components/ui/Button';

const timeFrames = [
  { key: 'today', label: 'Hoy' },
  { key: 'yesterday', label: 'Ayer' },
  { key: 'twoDaysAgo', label: 'Antes de Ayer' },
  { key: 'week', label: 'Esta Semana' },
  { key: 'month', label: 'Este Mes' },
  { key: 'lastMonth', label: 'Mes Pasado' }
];

export default function TimeFrameSelector({ activeTimeFrame, setActiveTimeFrame }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {timeFrames.map(({ key, label }) => (
        <Button
          key={key}
          onClick={() => setActiveTimeFrame(key)}
          variant={activeTimeFrame === key ? "default" : "outline"}
          className={`transition-all duration-200 ${activeTimeFrame === key ? "bg-blue-800 text-white" : "bg-gray-700 text-gray-400"}`}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}