import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { requestAPI } from '../services/api';
import { IRequest } from '../types';
import { ArrowLeft, Download, FileText, Clock, User, Tag } from 'lucide-react';

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<IRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('ID de demande invalide');
      setLoading(false);
      return;
    }
    loadRequest();
  }, [id]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const response = await requestAPI.getRequestById(id!);
      setRequest(response.data);
    } catch (err: any) {
      console.error('Error loading request:', err);
      setError('Impossible de charger la demande');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      const response = await requestAPI.exportPDF(id!);
      
      // Créer un blob et le télécharger
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `demande-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading PDF:', err);
      alert('Erreur lors du téléchargement du PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      submitted: 'bg-blue-100 text-blue-700',
      under_review: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700'
    };
    return badges[status] || badges.draft;
  };

  const getRequestTypeLabel = (type?: string): string => {
    const labels: Record<string, string> = {
      salary_negotiation: 'Renégociation salariale',
      promotion: 'Promotion',
      benefits_adjustment: 'Avantages',
      harassment_complaint: 'Signalement',
      workload_concern: 'Charge de travail',
      training_request: 'Formation',
      internal_mobility: 'Mobilité interne',
      general_inquiry: 'Demande générale'
    };
    return labels[type || ''] || type || 'Non spécifié';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-red-600 mb-4">
            <FileText className="w-12 h-12 mx-auto mb-2" />
            <p className="text-center font-semibold">{error || 'Demande introuvable'}</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                {request.title || getRequestTypeLabel(request.type || request.requestType)}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(request.status)}`}>
                  {request.status}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(request.createdAt || '').toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {downloadingPDF ? 'Téléchargement...' : 'PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Informations générales */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Informations générales
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Type de demande</p>
              <p className="font-medium text-gray-800">
                {getRequestTypeLabel(request.type || request.requestType)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Priorité</p>
              <span className="inline-block px-2 py-1 rounded text-sm font-medium bg-gray-100 text-gray-700">
                {request.priority || 'medium'}
              </span>
            </div>
            {request.isAnonymous && (
              <div className="col-span-2">
                <p className="text-sm text-amber-600 font-medium">
                  ⚠️ Demande anonyme
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {request.description && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Description
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {request.description}
            </p>
          </div>
        )}

        {/* Résumé IA */}
        {request.aiSummary && (
          <div className="bg-blue-50 rounded-lg shadow p-6 border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">
              📊 Résumé généré par l'IA
            </h2>
            <p className="text-blue-800 leading-relaxed">
              {request.aiSummary}
            </p>
          </div>
        )}

        {/* Scénarios proposés */}
        {request.aiScenarios && request.aiScenarios.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              💡 Scénarios proposés
            </h2>
            <ul className="space-y-3">
              {request.aiScenarios.map((scenario, index) => (
                <li key={index} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <p className="text-gray-700 flex-1">
                    {typeof scenario === 'string' 
                      ? scenario 
                      : scenario.description || JSON.stringify(scenario)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Notes RH */}
        {request.hrNotes && (
          <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
            <h2 className="text-lg font-semibold text-green-900 mb-4">
              📝 Notes du service RH
            </h2>
            <p className="text-green-800 whitespace-pre-wrap leading-relaxed">
              {request.hrNotes}
            </p>
          </div>
        )}

        {/* Résolution */}
        {request.resolution && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              ✅ Résolution
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Décision</p>
                <p className="text-gray-800 font-medium">{request.resolution.decision}</p>
              </div>
              {request.resolution.feedback && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Retour</p>
                  <p className="text-gray-700">{request.resolution.feedback}</p>
                </div>
              )}
              {request.resolution.actionTaken && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Action prise</p>
                  <p className="text-gray-700">{request.resolution.actionTaken}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}