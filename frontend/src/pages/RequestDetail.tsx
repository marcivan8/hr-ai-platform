import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/Api';
import { IRequest } from '../types';

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<IRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    API.get(`/requests/${id}`)
      .then((res) => setRequest(res.data))
      .catch(() => setError('Impossible de charger la demande.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6">Chargement...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!request) return <div className="p-6">Demande introuvable</div>;

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-semibold text-gray-800">{request.title}</h2>
      <div className="text-gray-600">
        Type: <span className="font-medium">{request.type}</span> — Statut: <span className="font-medium">{request.status}</span>
      </div>

      <div className="bg-white p-4 rounded shadow border">
        <h3 className="font-semibold mb-2">Description</h3>
        <p className="text-gray-700">{request.description}</p>
      </div>

      <div className="bg-white p-4 rounded shadow border">
        <h3 className="font-semibold mb-2">Résumé IA</h3>
        <p className="text-gray-700">{request.aiSummary || '—'}</p>

        {request.aiScenarios && request.aiScenarios.length > 0 && (
          <>
            <h4 className="mt-4 font-semibold">Scénarios proposés</h4>
            <ul className="list-decimal list-inside space-y-1">
              {request.aiScenarios.map((s, i) => (
                <li key={i} className="text-gray-700 text-sm">
                  {typeof s === 'string' ? s : JSON.stringify(s)}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Télécharger le PDF */}
      <div>
        <a
          href={`http://localhost:5000/api/requests/${request._id}/export-pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
        >
          Télécharger le PDF
        </a>
      </div>
    </div>
  );
}