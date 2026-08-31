'use client';

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";

type Usuario = {
  id: number;
  nome: string;
  ddd?: string;
  telefone?: string;
};

export default function UsuariosBibli() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [totalUsuarios, setTotalUsuarios] = useState<number>(0);

  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<Usuario | null>(null);

  // Campos do formulário
  const [novoNome, setNovoNome] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novoDdd, setNovoDdd] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");

  const [carregando, setCarregando] = useState(false);

  async function carregarUsuarios() {
    try {
      const resposta = await fetch("/api/frequentador");

      if (resposta.ok) {
        const dados = await resposta.json();
        setUsuarios(dados);
        setTotalUsuarios(dados.length);
      }
    } catch (erro) {
      console.error("Erro ao carregar usuários:", erro);
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  function abrirModalEdicao(usuario: Usuario) {
    setUsuarioEmEdicao(usuario);
    setNovoNome(usuario.nome || "");
    setNovaSenha(""); 
    setNovoDdd(usuario.ddd || "");
    setNovoTelefone(usuario.telefone || "");
    setModalAberto(true);
  }

  function abrirModalCadastro() {
    setUsuarioEmEdicao(null);
    setNovoNome("");
    setNovaSenha("");
    setNovoDdd("");
    setNovoTelefone("");
    setModalAberto(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!novoNome.trim()) {
      alert("O nome é obrigatório.");
      return;
    }

    // Trava de validação da senha para cadastros novos
    if (!usuarioEmEdicao) {
      if (!novaSenha.trim()) {
        alert("A senha é obrigatória.");
        return;
      }
      if (novaSenha.trim().length < 8) {
        alert("A senha precisa ter no mínimo 8 caracteres!");
        return;
      }
    }

    setCarregando(true);

    try {
      const url = usuarioEmEdicao
        ? `/api/frequentador/${usuarioEmEdicao.id}`
        : "/api/frequentador";

      const method = usuarioEmEdicao ? "PUT" : "POST";

      const bodyData: Record<string, any> = {
        nome: novoNome.trim(),
        ddd: novoDdd,
        telefone: novoTelefone,
      };

      // Envia a senha somente se for um novo cadastro
      if (!usuarioEmEdicao) {
        bodyData.senha = novaSenha.trim();
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      if (res.ok) {
        fecharModal();
        await carregarUsuarios();
      } else {
        const erro = await res.json();
        alert(erro.erro || "Erro ao salvar os dados do usuário.");
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("Erro de comunicação com o servidor.");
    } finally {
      setCarregando(false);
    }
  }

  function fecharModal() {
    if (carregando) return;

    setModalAberto(false);
    setUsuarioEmEdicao(null);
    setNovoNome("");
    setNovaSenha("");
    setNovoDdd("");
    setNovoTelefone("");
  }

  const usuariosFiltrados = usuarios.filter((user) =>
    user.nome?.toLowerCase().includes(termoPesquisa.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex flex-1">
        <Nav />

        <main className="flex-1 min-w-0 p-8 flex justify-center items-center">
          <div className="w-full max-w-3xl space-y-6">

            <div className="bg-brand-500 text-text-inverse p-6 rounded-2xl flex justify-between items-center shadow-md">
              <h2 className="text-2xl font-normal leading-snug">
                Quantidade de
                <br />
                Usuários:
              </h2>

              <span className="text-6xl font-bold">
                {totalUsuarios}
              </span>
            </div>

            <div className="flex gap-6">
              <button
                onClick={abrirModalCadastro}
                className="flex-1 bg-button-primary text-text-inverse font-medium py-3 px-6 rounded-2xl hover:brightness-110 transition shadow-sm text-center"
              >
                Cadastrar Novo Usuário
              </button>

              <button
                className="flex-1 bg-button-secondary text-text-inverse font-medium py-3 px-6 rounded-2xl hover:brightness-110 transition shadow-sm text-center"
              >
                Reativar Usuário
              </button>
            </div>

            <div className="space-y-2">
              <label className="block font-bold text-text-primary text-lg">
                Pesquisar por Usuário
              </label>

              <input
                type="text"
                placeholder="Nome do Usuário"
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
                className="w-full bg-white border border-brand-400 rounded-xl px-4 py-2 text-brand-800 placeholder-brand-500 focus:outline-none focus:ring-2 focus:ring-button-primary"
              />
            </div>

            <div className="border border-brand-800 rounded-t-xl overflow-hidden bg-white shadow-md">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-brand-800 text-text-inverse border-b border-brand-800 text-left">
                    <th className="p-3 border-r border-brand-700 font-bold text-lg w-1/2">
                      Nome do Usuário
                    </th>

                    <th className="p-3 font-bold text-lg text-center w-1/2">
                      Ações
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-brand-300">
                  {usuariosFiltrados.length > 0 ? (
                    usuariosFiltrados.map((usuario) => (
                      <tr
                        key={usuario.id}
                        className="hover:bg-brand-200/40 transition"
                      >
                        <td className="p-3 border-r border-brand-300 uppercase font-medium text-brand-800">
                          {usuario.nome}
                        </td>

                        <td className="p-2">
                          <div className="flex justify-center gap-2">

                            <button
                              className="bg-button-primary text-text-inverse px-3 py-1 rounded-lg hover:brightness-110 transition text-sm font-medium"
                            >
                              Detalhes
                            </button>

                            <button
                              onClick={() => abrirModalEdicao(usuario)}
                              className="bg-brand-500 text-text-inverse px-3 py-1 rounded-lg hover:brightness-110 transition text-sm font-medium"
                            >
                              Atualizar
                            </button>

                            <button
                              className="bg-button-secondary text-text-inverse px-3 py-1 rounded-lg hover:brightness-110 transition text-sm font-medium"
                            >
                              Deletar
                            </button>

                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={2}
                        className="p-4 text-center text-gray-500"
                      >
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </main>
      </div>

      {/* ================================================= */}
      {/* MODAL DE CADASTRO / EDIÇÃO */}
      {/* ================================================= */}

      {modalAberto && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={fecharModal}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >

            <h3 className="text-xl font-bold text-brand-800">
              {usuarioEmEdicao
                ? `Atualizar Frequentador #${usuarioEmEdicao.id}`
                : "Cadastrar Novo Frequentador"}
            </h3>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1">
                  Nome Completo
                </label>

                <input
                  type="text"
                  required
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: Ana Souza"
                  className="w-full border border-brand-400 rounded-xl p-2 text-brand-800 focus:outline-none focus:ring-2 focus:ring-button-primary"
                />
              </div>

              {/* Senha (Exibida APENAS na criação) */}
              {!usuarioEmEdicao && (
                <div>
                  <label className="block text-sm font-medium text-brand-800 mb-1">
                    Senha (mínimo de 8 caracteres)
                  </label>

                  <input
                    type="password"
                    required
                    minLength={8}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Digite a senha"
                    className="w-full border border-brand-400 rounded-xl p-2 text-brand-800 focus:outline-none focus:ring-2 focus:ring-button-primary"
                  />
                </div>
              )}

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-brand-800 mb-1">
                  Telefone
                </label>

                <div className="flex gap-2">

                  <input
                    type="text"
                    value={novoDdd}
                    onChange={(e) =>
                      setNovoDdd(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 2)
                      )
                    }
                    placeholder="DDD"
                    maxLength={2}
                    className="w-20 border border-brand-400 rounded-xl p-2 text-brand-800 focus:outline-none focus:ring-2 focus:ring-button-primary"
                  />

                  <input
                    type="text"
                    value={novoTelefone}
                    onChange={(e) =>
                      setNovoTelefone(
                        e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 9)
                      )
                    }
                    placeholder="999999999"
                    maxLength={9}
                    className="flex-1 border border-brand-400 rounded-xl p-2 text-brand-800 focus:outline-none focus:ring-2 focus:ring-button-primary"
                  />

                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 justify-end pt-2">

                <button
                  type="button"
                  onClick={fecharModal}
                  disabled={carregando}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={carregando}
                  className="px-4 py-2 rounded-xl bg-button-primary text-white hover:brightness-110 disabled:opacity-50"
                >
                  {carregando
                    ? "Salvando..."
                    : usuarioEmEdicao
                    ? "Atualizar"
                    : "Cadastrar"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}