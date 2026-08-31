"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function SearchFilters() {
  const [status, setStatus] = useState("");

  return (
    <div className="flex flex-col gap-3">
      {/* Input de nome de usuário */}
      <input
        type="text"
        placeholder="Nome do Usuário"
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-brand-600 outline-none focus:ring-2 focus:ring-brand-500"
      />

      {/* Filtros lado a lado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Por data"
          onFocus={(e) => (e.target.type = "date")}
          onBlur={(e) => !e.target.value && (e.target.type = "text")}
          className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-2 text-brand-600 outline-none focus:ring-2 focus:ring-brand-500"
        />

        {/* Container relativo para posicionar a seta sobre o select */}
        <div className="relative flex items-center">
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none absolute right-4 h-4 w-4 text-brand-600/70"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`w-full appearance-none rounded-2xl border border-gray-300 bg-white px-4 pr-10 py-2 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer ${
              status === "" ? "text-brand-600/50" : "text-brand-600"
            }`}
          >
            <option value="" disabled hidden>
              Por Status
            </option>
            <option value="em_andamento" className="text-brand-600">
              Em andamento
            </option>
            <option value="expirado" className="text-brand-600">
              Expirado
            </option>
            <option value="devolvido" className="text-brand-600">
              Devolvido
            </option>
          </select>
        </div>
      </div>
    </div>
  );
}