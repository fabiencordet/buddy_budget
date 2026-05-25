import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

// Exemple de données (à remplacer ensuite par vos données dynamiques/API)
const data = [
  { mois: 'Jan', entrees: 3500, depenses: 2800, solde: 700 },
  { mois: 'Fév', entrees: 3100, depenses: 2900, solde: 200 },
  { mois: 'Mar', entrees: 4200, depenses: 3400, solde: 800 },
  { mois: 'Avr', entrees: 3800, depenses: 4100, solde: -300 },
  { mois: 'Mai', entrees: 3900, depenses: 3100, solde: 800 },
];

export default function DashboardChart() {
  return (
    <div className="w-full h-[400px] bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-semibold text-slate-800 mb-4">Analyse Mensuelle Flux & Solde</h3>
      
      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis 
            dataKey="mois" 
            tickLine={false}
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis 
            tickLine={false}
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(value) => `${value} €`}
          />
          <Tooltip 
            formatter={(value) => [`${value} €`]}
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', borderColor: '#e2e8f0' }}
          />
          <Legend verticalAlign="top" height={36} />

          {/* Colonne Verte pour les Entrées */}
          <Bar 
            dataKey="entrees" 
            name="Entrées" 
            fill="#22c55e" 
            stroke="#16a34a" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={50}
          />
          
          {/* Colonne Rouge pour les Dépenses */}
          <Bar 
            dataKey="depenses" 
            name="Dépenses" 
            fill="#ef4444" 
            stroke="#dc2626" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={50}
          />
          
          {/* Courbe pour le Solde */}
          <Line 
            type="monotone" 
            dataKey="solde" 
            name="Solde Période" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
