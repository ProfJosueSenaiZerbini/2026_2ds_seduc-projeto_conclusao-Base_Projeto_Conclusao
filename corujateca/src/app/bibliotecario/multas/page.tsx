"use client";

import { useState } from "react";

import Header from "@/components/Header";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

type Multa = {
  id: number;
  usuario: string;
  diasPunicao: number;
  status: string;
  tipo: string;
  data: string;
};

export default function MultasPage() {
  const [usuario, setUsuario] = useState("");
  const [data, setData] = useState("");
  const [status, setStatus] = useState("");

  // Dados temporários
  // Depois serão substituídos pelos dados vindos do Prisma
  const multas: Multa[] = [
    {
      id: 1,
      usuario: "João da Silva",
      diasPunicao: 5,
      status: "Pendente",
      tipo: "Atraso na devolução",
      data: "20/08/2026",
    },
    {
      id: 2,
      usuario: "Maria Oliveira",
      diasPunicao: 10,
      status: "Pendente",
      tipo: "Depredação",
      data: "18/08/2026",
    },
    {
      id: 3,
      usuario: "Pedro Santos",
      diasPunicao: 7,
      status: "Paga",
      tipo: "Extravio",
      data: "15/08/2026",
    },
  ];

  const multasFiltradas = multas.filter((multa) => {
    const correspondeUsuario =
      usuario === "" ||
      multa.usuario.toLowerCase().includes(usuario.toLowerCase());

    const correspondeStatus =
      status === "" || multa.status === status;

    const correspondeData =
      data === "" || multa.data === data;

    return (
      correspondeUsuario &&
      correspondeStatus &&
      correspondeData
    );
  });

  return (
    <div className="flex min-h-screen flex-col bg-(--color-background)">

      <Header />

      <div className="flex min-w-0 flex-1">

        <Nav />

        <main
          className="
            min-w-0
            flex-1
            p-3
            sm:p-5
            md:p-6
            lg:p-8
            xl:p-10
          "
        >
          <div
            className="
              mx-auto
              w-full
              max-w-7xl
              space-y-6
              sm:space-y-8
            "
          >

            <section
              className="
                grid
                grid-cols-1
                gap-3
                sm:grid-cols-2
                lg:grid-cols-3
              "
            >

              <div
                className="
                  flex
                  min-h-[120px]
                  flex-col
                  items-center
                  justify-center
                  rounded-xl
                  bg-brand-500
                  p-3
                  text-center
                  text-text-inverse
                  shadow-md
                  sm:min-h-[140px]
                  sm:p-4
                  lg:min-h-[160px]
                "
              >
                <h2
                  className="
                    max-w-xs
                    font-semibold
                    leading-snug
                    sm:text-base
                    lg:text-lg
                  "
                >
                  Multas de Atraso
                  <br />
                  Ativas:
                </h2>

                <span
                  className="
                    mt-1
                    text-3xl
                    font-bold
                    md:text-4xl
                    xl:text-5xl
                  "
                >
                  5
                </span>
              </div>

              <div
                className="
                  flex
                  min-h-[120px]
                  flex-col
                  items-center
                  justify-center
                  rounded-xl
                  bg-brand-500
                  p-3
                  text-center
                  text-text-inverse
                  shadow-md
                  sm:min-h-[140px]
                  sm:p-4
                  lg:min-h-[160px]
                "
              >
                <h2
                  className="
                    max-w-xs
                    font-semibold
                    leading-snug
                    sm:text-base
                    lg:text-lg
                  "
                >
                  Multas de Depredação
                  <br />
                  Ativas:
                </h2>

                <span
                  className="
                    mt-1
                    text-3xl
                    font-bold
                    md:text-4xl
                    xl:text-5xl
                  "
                >
                  1
                </span>
              </div>

              <div
                className="
                  flex
                  min-h-[120px]
                  flex-col
                  items-center
                  justify-center
                  rounded-xl
                  bg-brand-500
                  p-3
                  text-center
                  text-text-inverse
                  shadow-md
                  sm:min-h-[140px]
                  sm:p-4
                  lg:min-h-[160px]
                "
              >
                <h2
                  className="
                    max-w-xs
                    font-semibold
                    leading-snug
                    sm:text-base
                    lg:text-lg
                  "
                >
                  Multas de Extravio
                  <br />
                  Ativas:
                </h2>

                <span
                  className="
                    mt-1
                    text-3xl
                    font-bold
                    md:text-4xl
                    xl:text-5xl
                  "
                >
                  2
                </span>
              </div>

            </section>

            <div className="flex justify-center">
              <button
                type="button"
                className="
                  w-full
                  max-w-md
                  rounded-2xl
                  bg-[var(--color-button-primary)]
                  px-6
                  py-3
                  text-base
                  font-bold
                  text-text-inverse
                  shadow-md
                  transition
                  hover:brightness-110
                  hover:shadow-lg
                  active:scale-[0.98]
                  sm:py-4
                  sm:text-lg
                "
              >
                Cadastrar Nova Multa
              </button>
            </div>

            <section
              className="
                rounded-3xl
                bg-brand-200
                p-4
                shadow-sm
                sm:p-5
                md:p-6
                lg:p-8
              "
            >

              <h1
                className="
                  mb-5
                  text-xl
                  font-bold
                  text-(--color-text-primary)
                  sm:text-2xl
                  lg:text-3xl
                "
              >
                Pesquisar por Multas
              </h1>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Nome do Usuário"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-gray-300
                    bg-white
                    px-5
                    py-3
                    text-brand-600
                    placeholder:text-brand-600/50
                    outline-none
                    focus:ring-2
                    focus:ring-brand-500
                    sm:py-4
                  "
                />
              </div>

              <div
                className="
                  grid
                  grid-cols-1
                  gap-3
                  md:grid-cols-2
                "
              >

                <input
                  type="text"
                  placeholder="Por data"
                  value={data}
                  onFocus={(e) => {
                    e.target.type = "date";
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) {
                      e.target.type = "text";
                    }
                  }}
                  onChange={(e) => setData(e.target.value)}
                  className="
                    w-full
                    rounded-2xl
                    border
                    border-gray-300
                    bg-white
                    px-5
                    py-3
                    text-brand-600
                    placeholder:text-brand-600/50
                    outline-none
                    focus:ring-2
                    focus:ring-brand-500
                    sm:py-4
                  "
                />

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className={`
                    w-full
                    appearance-none
                    rounded-2xl
                    border
                    border-gray-300
                    bg-white
                    px-5
                    py-3
                    outline-none
                    focus:ring-2
                    focus:ring-brand-500
                    cursor-pointer
                    bg-[right_1.25rem_center]
                    bg-no-repeat
                    bg-[url('data:image/svg+xml;charset=UTF-8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%239e8a78" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')]
                    sm:py-4
                    ${
                      status === ""
                        ? "text-brand-600/50"
                        : "text-brand-600"
                    }
                  `}
                >
                  <option value="" disabled hidden>
                    Por Status
                  </option>

                  <option
                    value="Pendente"
                    className="text-brand-600"
                  >
                    Pendente
                  </option>

                  <option
                    value="Paga"
                    className="text-brand-600"
                  >
                    Paga
                  </option>
                </select>

              </div>

              <div className="mt-6 flex flex-col gap-4">

                {multasFiltradas.map((multa) => (

                  <div
                    key={multa.id}
                    className="
                      grid
                      grid-cols-1
                      gap-5
                      rounded-2xl
                      bg-brand-400
                      px-4
                      py-4
                      text-sm
                      font-bold
                      text-text-inverse
                      sm:px-5
                      sm:py-5
                      sm:text-base
                      lg:px-8
                      lg:py-6
                      md:grid-cols-2
                      md:gap-8
                      lg:gap-12
                    "
                  >

                    <div className="space-y-2">

                      <p className="text-lg">
                        {multa.usuario}
                      </p>

                      <p>
                        Dias de punição:{" "}
                        {multa.diasPunicao} dias
                      </p>

                      <p>
                        Status da Multa:{" "}
                        {multa.status}
                      </p>

                    </div>

                    <div className="space-y-2">

                      <p>
                        Tipo da Multa:{" "}
                        {multa.tipo}
                      </p>

                      <p>
                        Data da Multa:{" "}
                        {multa.data}
                      </p>

                    </div>

                    <button
                      type="button"
                      className="
                        col-span-1
                        w-full
                        rounded-xl
                        bg-[var(--color-button-secondary)]
                        px-4
                        py-3
                        text-sm
                        font-bold
                        text-text-inverse
                        transition
                        hover:brightness-110
                        active:scale-[0.99]
                        md:col-span-2
                        sm:py-4
                        sm:text-base
                      "
                    >
                      Cancelar
                    </button>

                  </div>

                ))}

                {/* NENHUM RESULTADO */}
                {multasFiltradas.length === 0 && (
                  <div
                    className="
                      py-8
                      text-center
                      text-base
                      text-text-inverse
                    "
                  >
                    Nenhuma multa encontrada.
                  </div>
                )}

              </div>

            </section>

          </div>
        </main>

      </div>

      {/* FOOTER */}
      <Footer />

    </div>
  );
}