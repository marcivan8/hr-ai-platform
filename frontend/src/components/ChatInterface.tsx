import React, { useState, useEffect, useRef } from "react";
import { requestAPI } from "../services/api";
import { IRequest, RequestType, normalizeRequestType } from "../types";
import { Send, Loader, CheckCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

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
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isConversationMode, setIsConversationMode] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  // Créer la demande initiale et démarrer la conversation
  async function handleStartConversation(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);

    try {
      // Créer la demande
      const res = await requestAPI.createRequest({
        title,
        type: normalizeRequestType(type),
        description
      });

      const request: IRequest = res.data?.request;
      
      if (!request || !request._id) {
        throw new Error("Erreur lors de la création de la demande");
      }

      setCurrentRequestId(request._id);
      
      // Ajouter le message initial de l'utilisateur
      const initialMessage: Message = {
        role: "user",
        content: description,
        timestamp: new Date()
      };
      setMessages([initialMessage]);

      // Obtenir la première réponse de l'IA
      await sendFollowUpQuestion(request._id, description);

      setIsConversationMode(true);

    } catch (error: any) {
        // Improved error extraction for clearer debugging
        console.error('Error creating request:', error);
        const status = error?.response?.status;
        const url = error?.config?.url;
        const respData = error?.response?.data;
        const respText = typeof respData === 'string' ? respData : (respData && typeof respData === 'object' ? JSON.stringify(respData) : null);
        const fallbackMsg = `❌ Une erreur est survenue lors de l'envoi.${status ? ` (status ${status})` : ''}`;
        const errorMessage = (respData && (respData.error || respData.message)) || respText || error?.message || fallbackMsg;
        alert(`Erreur: ${errorMessage}\nURL: ${url || 'unknown'}\nStatus: ${status || 'unknown'}`);
    } finally {
      setLoading(false);
    }
  }

  // Envoyer une question de suivi à l'IA
  async function sendFollowUpQuestion(requestId: string, userMessage: string) {
    try {
      const response = await requestAPI.sendMessage(requestId, userMessage);
      
      const aiReply = response.data?.aiReply || "Désolé, je n'ai pas compris.";
      
      const aiMessage: Message = {
        role: "assistant",
        content: aiReply,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Vérifier si l'IA indique que la conversation est terminée
      if (aiReply.toLowerCase().includes("demande est complète") || 
          aiReply.toLowerCase().includes("toutes les informations") ||
          aiReply.toLowerCase().includes("merci pour ces informations")) {
        setIsComplete(true);
      }

    } catch (error: any) {
        console.error('Error sending message:', error);
        const status = error?.response?.status;
        const url = error?.config?.url;
        const respData = error?.response?.data;
        const respText = typeof respData === 'string' ? respData : (respData && typeof respData === 'object' ? JSON.stringify(respData) : null);
        const errorMsg = (respData && (respData.error || respData.message)) || respText || error?.message || 'Erreur de communication avec l\'IA';

        const errorMessage: Message = {
          role: "assistant",
          content: `❌ ${errorMsg} (url: ${url || 'unknown'}, status: ${status || 'unknown'})`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
    }
  }

  // Gérer l'envoi d'un message utilisateur
  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!userInput.trim() || !currentRequestId) return;

    setLoading(true);

    // Ajouter le message utilisateur
    const userMessage: Message = {
      role: "user",
      content: userInput,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    const messageToSend = userInput;
    setUserInput("");

    // Obtenir la réponse de l'IA
    await sendFollowUpQuestion(currentRequestId, messageToSend);
    
    setLoading(false);
  }

  // Finaliser et soumettre la demande
  async function handleFinalizeRequest() {
    if (!currentRequestId) return;

    setLoading(true);

    try {
      // Récupérer la demande mise à jour
      const response = await requestAPI.getRequestById(currentRequestId);
      const request = response.data;

      if (onSaved) {
        onSaved(request);
      }

      alert("✅ Votre demande a été envoyée au service RH avec succès !");
      
      // Rediriger après 1 seconde
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);

    } catch (error: any) {
      console.error('Error finalizing request:', error);
      alert("Erreur lors de la finalisation de la demande");
    } finally {
      setLoading(false);
    }
  }

  // Mode initial : formulaire de création
  if (!isConversationMode) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          🤖 Assistant IA — Nouvelle demande
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          L'assistant IA vous posera des questions pour mieux comprendre votre demande.
        </p>

        <form onSubmit={handleStartConversation} className="space-y-4">
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
              Description initiale *
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez brièvement votre demande. L'IA vous posera ensuite des questions pour plus de détails..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Démarrage de la conversation...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Démarrer la conversation avec l'IA
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  // Mode conversation : chat avec l'IA
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 flex flex-col" style={{ height: '600px' }}>
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          🤖 Conversation avec l'Assistant IA
        </h3>
        <p className="text-sm text-blue-100 mt-1">
          {title} - {requestTypes.find(t => t.value === type)?.label}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <p className={`text-xs mt-2 ${
                msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
              }`}>
                {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-2">
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-gray-600">L'IA réfléchit...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input zone */}
      <div className="p-4 border-t bg-white rounded-b-xl">
        {!isComplete ? (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Tapez votre réponse..."
              disabled={loading}
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={loading || !userInput.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle className="w-5 h-5" />
              <span>Conversation terminée</span>
            </div>
            <button
              onClick={handleFinalizeRequest}
              disabled={loading}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Envoyer la demande au RH
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}