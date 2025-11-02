import React from "react";
import { RequestType } from "../types";

interface Props {
  value: RequestType;
  onChange: (v: RequestType) => void;
}

const labels: Record<RequestType, string> = {
  salary: "Renégociation salariale",
  promotion: "Promotion",
  complaint: "Plainte",
  other: "Autre"
};

export default function RequestTypeSelector({ value, onChange }: Props) {
  const opts: RequestType[] = ["salary", "promotion", "complaint", "other"];

  return (
    <div className="flex flex-wrap gap-2">
      {opts.map((o) => {
        const active = value === o;

        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o)}
            className={`px-3 py-2 text-sm rounded-lg transition font-medium
              ${active 
                ? "bg-primary-600 text-white shadow-md" 
                : "border border-gray-300 text-gray-700 bg-white hover:bg-gray-100"
              }
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1`}
          >
            {labels[o]}
          </button>
        );
      })}
    </div>
  );
}