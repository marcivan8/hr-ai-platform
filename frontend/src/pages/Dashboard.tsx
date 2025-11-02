import React, { useEffect, useState } from 'react';
import API from '../services/Api';
import { IRequest } from '../types';
import { Link } from 'react-router-dom';

export default function Dashboard(){
  const [list, setList] = useState<IRequest[]>([]);
  useEffect(()=>{ API.get('/requests').then(r=>setList(r.data)).catch(()=>{}); },[]);
  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Mes demandes</h2>
      <div className="grid grid-cols-1 gap-3">
        {list.map(l=> (
          <div key={(l as any)._id} className="p-3 bg-white rounded shadow">
            <div className="flex justify-between">
              <div>
                <div className="font-semibold">{l.title}</div>
                <div className="text-sm text-gray-600">{l.type} — {l.status}</div>
              </div>
              <div>
                <Link to={`/requests/${(l as any)._id}`} className="text-primary-600 underline">Voir</Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}