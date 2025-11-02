import React, { useState } from "react";
import API from "../services/Api";
import { Request, RequestType } from "../types";

interface Props {
  initialRequest?: Partial<Request>;
  onSaved?: (r: Request) => void;
}

export default function ChatInterface({ initialRequest, onSaved }: Props) {
  const [title, setTitle] = useState(initialRequest?.title ?? "");
  const [type, setType] = useState<RequestType>(initialRequest?.type ?? "other");
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
      const res = await API.post("/requests", { title, type, description });

      const request: Request = res.data?.request;
      onSaved?.(request);

      setMessage("✅ Demande envoyée au service RH.");
      setTitle("");
      setType("other");
      setDescription("");
    } catch (error: unknown) {
      console.error(error);
      if (typeof error === "object" && error !== null && "response" in error) {
        const err = error as any;
        setMessage(err?.response?.data?.error || "❌ Une erreur est survenue.");
      } else {
        setMessage("❌ Impossible de communiquer avec le serveur.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">
        Assistant IA — Soumettre une demande
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Titre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de votre demande"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as RequestType)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-primary-500 outline-none"
          >
            <option value="salary">Renégociation salariale</option>
            <option value="promotion">Promotion</option>
            <option value="complaint">Plainte</option>
            <option value="other">Autre</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Expliquez votre demande..."
            className="w-full p-2 border rounded-md h-36 focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition disabled:opacity-60"
        >
          {loading ? "⏳ Envoi..." : "Envoyer au RH"}
        </button>

        {/* Message */}
        {message && (
          <div
            className={`mt-2 text-sm font-medium ${
              message.startsWith("✅") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}