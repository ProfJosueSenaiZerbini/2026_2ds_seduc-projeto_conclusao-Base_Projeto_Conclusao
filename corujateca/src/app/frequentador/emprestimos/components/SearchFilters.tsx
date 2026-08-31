"use client";

import { useState } from "react";

export default function SearchFilters() {
  const [status, setStatus] = useState("");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

      <input
        type="text"
        placeholder="Por data"
        onFocus={(e) => (e.target.type = "date")}
        onBlur={(e) => !e.target.value && (e.target.type = "text")}
        className="w-full rounded-2xl border border-gray-300 bg-white px-5 py-3 text-brand-600 placeholder:text-brand-600/50 outline-none focus:ring-2 focus:ring-brand-500"
      />

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className={`w-full appearance-none rounded-2xl border border-gray-300 bg-white px-5 py-3 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer bg-[right_1.25rem_center] bg-no-repeat bg-[url('data:image/svg+xml;charset=UTF-8,<svg%20xmlns="http://www.w3.org/2000/svg"%20width="16"%20height="16"%20viewBox="0%200%2024%2024"%20fill="none"%20stroke="%239e8a78"%20stroke-width="2"%20stroke-linecap="round"%20stroke-linejoin="round"><path%20d="m6%209%206%206%206-6"/></svg>')] ${
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
  );
}