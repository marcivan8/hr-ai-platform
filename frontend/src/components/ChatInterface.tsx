import React, { useState } from "react";
import { requestAPI } from "../services/Api";
import { IRequest, RequestType, normalizeRequestType } from "../types";

interface Props {
  initialRequest?: Partial<IRequest>;
  onSaved?: (r: IRequest) => void;
}

export default function ChatInterface({ initialRequest, onSaved }: Props) {
  const [title, setTitle] = useState(initialRequest?.title ?? "");
  const [type, setType] = useState<RequestType>(
    initialRequest?.type as RequestType ?? 
    initialRequest?.requestType ?? 
    "general_inquiry"
  );
  const [description, setDescription] = useState(initialRequest?.description ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setMessage("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await requestAPI.createRequest({
        title,
        type: normalizeRequestType(type),
        description
      });

      const request: IRequest = res.data?.request;
      
      if (onSaved && request) {
        onSaved(request);
      }

      setMessage("✅ Demande envoyée au service RH avec succès.");
      
      // Réinitialiser le formulaire
      setTitle("");
      setType("general_inquiry");
      setDescription("");

      // Rediriger après 2 secondes
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);

    } catch (error: any) {
      console.error('Error creating request:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message ||
                          "❌ Une erreur est survenue lors de l'envoi.";
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const requestTypes: Array<{ value: RequestType; label: string }> = [
    { value: 'salary_negotiation', label: 'Renégociation salariale' },
    { value: 'promotion', label: 'Demande de promotion' },
    { value: 'benefits_adjustment', label: 'Ajustement des avantages' },
    { value: 'harassment_complaint', label: 'Plainte (harcèlement)' },
    { value: 'workload_concern', label: 'Charge de travail' },
    { value: 'training_request', label: 'Demande de formation' },
    { value: 'internal_mobility', label: 'Mobilité interne' },
    { value: 'general_inquiry', label: 'Demande générale' }
  ];

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">
        Assistant IA — Soumettre une demande
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Titre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre de votre demande *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Demande d'augmentation salariale"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type de demande *
          </label>
          <select
            required
            value={type}
            onChange={(e) => setType(e.target.value as RequestType)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {requestTypes.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description détaillée *
          </label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Expliquez votre demande en détail..."
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
          />
          <p className="text-xs text-gray-500 mt-1">
            Soyez aussi précis que possible pour nous aider à traiter votre demande
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Envoi en cours...
            </span>
          ) : (
            "Envoyer au RH"
          )}
        </button>

        {/* Message */}
        {message && (
          <div
            className={`mt-2 p-3 rounded-lg text-sm font-medium ${
              message.startsWith("✅") 
                ? "bg-green-50 text-green-700 border border-green-200" 
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}