import React, { useEffect, useState } from 'react';
import { requestAPI } from '../services/Api';
import { IRequest } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import ChatInterface from '../components/chatInterface';
import { FileText, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';

export default function Dashboard() {
  const [requests, setRequests] = useState<IRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewRequest, setShowNewRequest] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await requestAPI.getMyRequests();
      setRequests(response.data || []);
    } catch (err: any) {
      console.error('Error loading requests:', err);
      setError('Impossible de charger vos demandes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: any }> = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: FileText },
      submitted: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock },
      under_review: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertCircle },
      resolved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle }
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
      general_inquiry: 'Demande générale',
      salary: 'Renégociation salariale',
      complaint: 'Plainte',
      other: 'Autre'
    };
    return labels[type || ''] || type || 'Non spécifié';
  };

  const handleRequestSaved = (request: IRequest) => {
    setShowNewRequest(false);
    loadRequests();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Mes Demandes</h1>
              <p className="text-gray-600 mt-1">Gérez vos demandes RH</p>
            </div>
            <button
              onClick={() => setShowNewRequest(!showNewRequest)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-5 h-5" />
              Nouvelle demande
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Formulaire de nouvelle demande */}
        {showNewRequest && (
          <div className="mb-8">
            <ChatInterface onSaved={handleRequestSaved} />
          </div>
        )}

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-gray-800">{requests.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
            <p className="text-sm text-gray-600">En cours</p>
            <p className="text-2xl font-bold text-yellow-600">
              {requests.filter(r => r.status === 'submitted' || r.status === 'under_review').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Résolues</p>
            <p className="text-2xl font-bold text-green-600">
              {requests.filter(r => r.status === 'resolved').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-600">Rejetées</p>
            <p className="text-2xl font-bold text-red-600">
              {requests.filter(r => r.status === 'rejected').length}
            </p>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Liste des demandes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Historique de vos demandes
            </h2>
            
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Aucune demande pour le moment</p>
                <button
                  onClick={() => setShowNewRequest(true)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Créer votre première demande
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => {
                  const badge = getStatusBadge(request.status);
                  const Icon = badge.icon;

                  return (
                    <div
                      key={request._id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => navigate(`/requests/${request._id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-800">
                              {request.title || getRequestTypeLabel(request.type || request.requestType)}
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
                              {request.priority || 'medium'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {getRequestTypeLabel(request.type || request.requestType)}
                          </p>
                          
                          {request.description && (
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {request.description}
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-400 mt-2">
                            Créée le {new Date(request.createdAt || '').toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                            <Icon className="w-4 h-4" />
                            {request.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}