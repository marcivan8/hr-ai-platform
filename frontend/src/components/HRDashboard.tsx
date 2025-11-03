import React, { useState, useEffect } from 'react';
import { requestAPI } from '../services/api';
import { BarChart3, Users, AlertCircle, CheckCircle, Clock, FileText, Download } from 'lucide-react';

interface DashboardStats { total: number; pending: number; resolved: number; urgent: number; }
interface HRDashboardProps { onViewRequest: (requestId: string) => void; }

export const HRDashboard: React.FC<HRDashboardProps> = ({ onViewRequest }) => {
  const [stats, setStats] = useState<DashboardStats>({ total: 0, pending: 0, resolved: 0, urgent: 0 });
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsByType, setRequestsByType] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'analytics'>('overview');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      const response = await requestAPI.getAllRequestsForHR();
      const statsResponse = await fetch('/api/hr/dashboard/stats', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData.data.stats);
        setRequestsByType(statsData.data.requestsByType);
      }
      setRequests(response.data.requests);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = { draft: 'bg-gray-100 text-gray-700', submitted: 'bg-blue-100 text-blue-700', under_review: 'bg-yellow-100 text-yellow-700', resolved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };
    return styles[status] || styles.draft;
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = { low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-600', high: 'bg-orange-100 text-orange-600', urgent: 'bg-red-100 text-red-600' };
    return styles[priority] || styles.medium;
  };

  const getRequestTypeLabel = (type: string): string => {
    const labels: Record<string, string> = { salary_negotiation: 'Renégociation salariale', promotion: 'Promotion', benefits_adjustment: 'Avantages', harassment_complaint: 'Signalement', workload_concern: 'Charge de travail', training_request: 'Formation', internal_mobility: 'Mobilité', general_inquiry: 'Autre' };
    return labels[type] || type;
  };

  const filteredRequests = requests.filter(req => filterStatus === 'all' ? true : req.status === filterStatus);

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard RH</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble et gestion des demandes</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600 mb-1">Total demandes</p><p className="text-3xl font-bold text-gray-800">{stats.total}</p></div>
              <FileText className="w-10 h-10 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600 mb-1">En attente</p><p className="text-3xl font-bold text-yellow-600">{stats.pending}</p></div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600 mb-1">Résolues</p><p className="text-3xl font-bold text-green-600">{stats.resolved}</p></div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-gray-600 mb-1">Urgentes</p><p className="text-3xl font-bold text-red-600">{stats.urgent}</p></div>
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <div className="flex gap-8 px-6">
              {['overview', 'requests', 'analytics'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`py-4 border-b-2 font-medium transition ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800'}`}>
                  {tab === 'overview' && 'Vue d\'ensemble'}
                  {tab === 'requests' && 'Demandes'}
                  {tab === 'analytics' && 'Analytiques'}
                </button>
              ))}
            </div>
          </div>
          {activeTab === 'overview' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Demandes par type</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {requestsByType.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{getRequestTypeLabel(item._id)}</p>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{item.count}</p>
                  </div>
                ))}
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mt-8 mb-4">Demandes récentes</h3>
              <div className="space-y-3">
                {requests.slice(0, 5).map((request) => (
                  <div key={request._id} onClick={() => onViewRequest(request._id)} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-800">{getRequestTypeLabel(request.requestType)}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(request.priority)}`}>{request.priority}</span>
                        </div>
                        <p className="text-sm text-gray-600">{request.employeeId?.firstName} {request.employeeId?.lastName} - {request.employeeId?.department}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(request.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>{request.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === 'requests' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2">
                  {['all', 'submitted', 'under_review', 'resolved'].map((status) => (
                    <button key={status} onClick={() => setFilterStatus(status)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === status ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      {status === 'all' ? 'Toutes' : status}
                    </button>
                  ))}
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"><Download className="w-4 h-4" />Exporter</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employé</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priorité</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div><div className="text-sm font-medium text-gray-900">{request.employeeId?.firstName} {request.employeeId?.lastName}</div><div className="text-sm text-gray-500">{request.employeeId?.department}</div></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getRequestTypeLabel(request.requestType)}</td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityBadge(request.priority)}`}>{request.priority}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(request.status)}`}>{request.status}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(request.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm"><button onClick={() => onViewRequest(request._id)} className="text-blue-600 hover:text-blue-800 font-medium">Voir détails</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === 'analytics' && (
            <div className="p-6">
              <div className="flex items-center gap-2 text-gray-600 mb-4"><BarChart3 className="w-5 h-5" /><h3 className="text-lg font-semibold">Analytiques détaillées</h3></div>
              <p className="text-gray-600">Fonctionnalité d'analytiques avancées à venir...</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-blue-50 rounded-lg p-6"><h4 className="font-semibold text-blue-900 mb-2">Taux de résolution</h4><p className="text-3xl font-bold text-blue-600">{((stats.resolved / stats.total) * 100).toFixed(1)}%</p></div>
                <div className="bg-green-50 rounded-lg p-6"><h4 className="font-semibold text-green-900 mb-2">Satisfaction moyenne</h4><p className="text-3xl font-bold text-green-600">4.5/5</p></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};