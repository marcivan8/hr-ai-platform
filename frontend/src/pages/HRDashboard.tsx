import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { IRequest } from '../types';
import { Link } from 'react-router-dom';

export default function HRDashboard(){
  const [list, setList] = useState<IRequest[]>([]);
  useEffect(()=>{ API.get('/requests').then(r=>setList(r.data)).catch(()=>{}); },[]);
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Tableau RH — Demandes</h2>
      <div className="grid grid-cols-1 gap-3">
        {list.map(l=> (
          <div key={(l as any)._id} className="p-3 bg-white rounded shadow">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{l.title}</div>
                <div className="text-sm text-gray-600">{l.type} — {(l.employeeId as any).email}</div>
                <div className="text-xs text-gray-500 mt-2">{l.aiSummary?.slice(0,200) || '—'}</div>
              </div>
              <div className="flex flex-col gap-2">
                <Link to={`/requests/${(l as any)._id}`} className="text-primary-600 underline">Ouvrir</Link>
                <a href={`${process.env.REACT_APP_API_URL}/requests/${(l as any)._id}/pdf`} target="_blank" rel="noreferrer" className="text-sm">Télécharger PDF</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}