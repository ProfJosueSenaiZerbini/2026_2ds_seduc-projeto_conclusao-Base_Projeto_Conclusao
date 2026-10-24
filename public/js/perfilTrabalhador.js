(function () {
    "use strict";

    // ---------- Elementos ----------
    const modoVisualizacao = document.getElementById("modo-visualizacao");
    const modoEdicao = document.getElementById("modo-edicao");
    const btnEditar = document.getElementById("btn-editar");
    const btnCancelar = document.getElementById("btn-cancelar");
    const btnAlterarSenha = document.getElementById("btn-alterar-senha");
    const blocoSenha = document.getElementById("bloco-senha");
    const form = document.getElementById("form-perfil");
    const btnSalvar = document.getElementById("btn-salvar");
    const feedbackBanner = document.getElementById("feedback-banner");

    const inputNome = document.getElementById("input-nome");
    const inputEmail = document.getElementById("input-email");
    const inputTelefone = document.getElementById("input-telefone");
    const inputCpf = document.getElementById("input-cpf");
    const inputSenhaAtual = document.getElementById("input-senha-atual");
    const inputSenhaNova = document.getElementById("input-senha-nova");
    const inputSenhaConfirmar = document.getElementById("input-senha-confirmar");

    const URL_SALVAR_PERFIL = "/api/perfil/atualizar";

    // =========================================================
    // Toggle entre visualização e edição
    // =========================================================
    function entrarModoEdicao() {
        modoVisualizacao.hidden = true;
        modoEdicao.hidden = false;
        limparFeedback();
        inputNome.focus();
    }

    function sairModoEdicao() {
        modoEdicao.hidden = true;
        modoVisualizacao.hidden = false;
        resetarFormulario();
    }

    function resetarFormulario() {
        const usuario = window.__USUARIO__ || {};
        inputNome.value = usuario.nomeCompleto || "";
        inputEmail.value = usuario.email || "";
        inputTelefone.value = usuario.telefone || "";
        inputCpf.value = usuario.cpf || "";
        inputSenhaAtual.value = "";
        inputSenhaNova.value = "";
        inputSenhaConfirmar.value = "";
        blocoSenha.hidden = true;
        limparErros();
    }

    btnEditar.addEventListener("click", entrarModoEdicao);
    btnCancelar.addEventListener("click", sairModoEdicao);

    btnAlterarSenha.addEventListener("click", function () {
        entrarModoEdicao();
        blocoSenha.hidden = false;
        inputSenhaAtual.focus();
    });

    // =========================================================
    // Máscaras
    // =========================================================
    function mascaraTelefone(valor) {
        let v = valor.replace(/\D/g, "").slice(0, 11);
        if (v.length > 10) {
            v = v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        } else if (v.length > 5) {
            v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
        } else if (v.length > 2) {
            v = v.replace(/(\d{2})(\d{0,5})/, "($1) $2");
        } else if (v.length > 0) {
            v = v.replace(/(\d{0,2})/, "($1");
        }
        return v.trim();
    }

    function mascaraCpf(valor) {
        let v = valor.replace(/\D/g, "").slice(0, 11);
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d)/, "$1.$2");
        v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        return v;
    }

    inputTelefone.addEventListener("input", function (e) {
        e.target.value = mascaraTelefone(e.target.value);
    });

    inputCpf.addEventListener("input", function (e) {
        e.target.value = mascaraCpf(e.target.value);
    });

    // =========================================================
    // Validações
    // =========================================================
    function limparErros() {
        document.querySelectorAll(".error-msg").forEach(function (el) {
            el.textContent = "";
        });
        document.querySelectorAll(".input--invalid").forEach(function (el) {
            el.classList.remove("input--invalid");
        });
    }

    function definirErro(campoNome, mensagem, inputEl) {
        const erroEl = document.querySelector('[data-error-for="' + campoNome + '"]');
        if (erroEl) erroEl.textContent = mensagem;
        if (inputEl) inputEl.classList.add("input--invalid");
    }

    function emailValido(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function cpfValido(cpf) {
        return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf);
    }

    function telefoneValido(tel) {
        return /^\(\d{2}\) \d{4,5}-\d{4}$/.test(tel);
    }

    function validarFormulario() {
        limparErros();
        let valido = true;

        if (!inputNome.value.trim()) {
            definirErro("nomeCompleto", "Informe seu nome completo.", inputNome);
            valido = false;
        }

        if (!inputEmail.value.trim() || !emailValido(inputEmail.value.trim())) {
            definirErro("email", "Informe um email válido.", inputEmail);
            valido = false;
        }

        if (!telefoneValido(inputTelefone.value.trim())) {
            definirErro("telefone", "Informe um telefone válido.", inputTelefone);
            valido = false;
        }

        if (!cpfValido(inputCpf.value.trim())) {
            definirErro("cpf", "Informe um CPF válido.", inputCpf);
            valido = false;
        }

        // Só valida senha se o bloco estiver visível (usuário pediu para alterar)
        if (!blocoSenha.hidden) {
            if (!inputSenhaAtual.value) {
                definirErro("senhaAtual", "Informe a senha atual.", inputSenhaAtual);
                valido = false;
            }
            if (!inputSenhaNova.value || inputSenhaNova.value.length < 8) {
                definirErro("senhaNova", "A nova senha deve ter ao menos 8 caracteres.", inputSenhaNova);
                valido = false;
            }
            if (inputSenhaConfirmar.value !== inputSenhaNova.value) {
                definirErro("senhaConfirmar", "As senhas não conferem.", inputSenhaConfirmar);
                valido = false;
            }
        }

        return valido;
    }

    // =========================================================
    // Feedback visual
    // =========================================================
    function mostrarFeedback(tipo, mensagem) {
        feedbackBanner.hidden = false;
        feedbackBanner.textContent = mensagem;
        feedbackBanner.className = "feedback-banner feedback-banner--" + tipo;
        feedbackBanner.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function limparFeedback() {
        feedbackBanner.hidden = true;
        feedbackBanner.textContent = "";
    }

    function definirCarregando(carregando) {
        btnSalvar.disabled = carregando;
        btnSalvar.querySelector(".btn__label").hidden = carregando;
        btnSalvar.querySelector(".btn__spinner").hidden = !carregando;
    }

    // =========================================================
    // Atualiza o modo de visualização com os novos dados
    // =========================================================
    function atualizarTelaVisualizacao(usuarioAtualizado) {
        window.__USUARIO__ = usuarioAtualizado;
        document.querySelectorAll("#modo-visualizacao dd").forEach(function () { });
        const dds = modoVisualizacao.querySelectorAll(".info-item dd");
        dds[0].textContent = usuarioAtualizado.nomeCompleto;
        dds[1].textContent = usuarioAtualizado.email;
        dds[2].textContent = usuarioAtualizado.telefone;
        dds[3].textContent = usuarioAtualizado.cpf;
        modoVisualizacao.querySelector(".perfil-header__nome").textContent = usuarioAtualizado.nomeCompleto;
    }

    // =========================================================
    // Envio (POST)
    // =========================================================
    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        limparFeedback();

        if (!validarFormulario()) {
            mostrarFeedback("error", "Verifique os campos destacados antes de salvar.");
            return;
        }

        const payload = {
            nomeCompleto: inputNome.value.trim(),
            email: inputEmail.value.trim(),
            telefone: inputTelefone.value.trim(),
            cpf: inputCpf.value.trim(),
        };

        if (!blocoSenha.hidden) {
            payload.senhaAtual = inputSenhaAtual.value;
            payload.senhaNova = inputSenhaNova.value;
        }

        definirCarregando(true);

        try {
            const resposta = await fetch(URL_SALVAR_PERFIL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!resposta.ok) {
                const erro = await resposta.json().catch(function () { return {}; });
                throw new Error(erro.mensagem || "Não foi possível salvar suas informações.");
            }

            const dados = await resposta.json();
            atualizarTelaVisualizacao(dados.usuario || payload);
            sairModoEdicao();
            mostrarFeedback("success", "Perfil atualizado com sucesso!");
        } catch (erro) {
            mostrarFeedback("error", erro.message || "Algo deu errado. Tente novamente.");
        } finally {
            definirCarregando(false);
        }
    });
})();