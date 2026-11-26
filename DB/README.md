# 🗄️ Banco de Dados do Projeto

Este diretório contém os scripts de inicialização e estruturação do banco de dados do projeto **Lumina Blog**.

---

## ☁️ 1. Banco Online (Supabase - PostgreSQL) [Recomendado]

O script principal para execução no Supabase é o [supabase.sql](file:///c:/Users/aluno/OneDrive%20-%20SESISENAISP%20-%20Escolas/Documentos/hayc/1211/projeto-conclusao-blog/DB/supabase.sql).

### Como aplicar no Supabase:
1. Acesse o painel do Supabase: [SQL Editor](https://supabase.com/dashboard).
2. Abra seu projeto (`sujfguorzowifvtqymzs`).
3. Clique em **SQL Editor** -> **New Query**.
4. Cole o conteúdo de [supabase.sql](file:///c:/Users/aluno/OneDrive%20-%20SESISENAISP%20-%20Escolas/Documentos/hayc/1211/projeto-conclusao-blog/DB/supabase.sql) e clique em **Run**.

### Tabelas criadas:
* `usuario`: dados das usuárias, fotos, perfil, bio e senha com hash.
* `posts`: publicações, categoria, conteúdo e imagens.
* `curtidas`: relação de curtidas das usuárias nas publicações.
* `comentarios`: comentários feitos nas publicações.
* `chat_publico`: mensagens da comunidade no chat em tempo real.

---

## 💻 2. Banco Local (MySQL / XAMPP) [Opcional]

Para rodar localmente com XAMPP / MySQL, utilize o arquivo [db.config](file:///c:/Users/aluno/OneDrive%20-%20SESISENAISP%20-%20Escolas/Documentos/hayc/1211/projeto-conclusao-blog/DB/db.config).

1. Inicie o Apache e o MySQL no **XAMPP Control Panel**.
2. Acesse `http://localhost/phpmyadmin`.
3. Vá na aba **Importar** ou **SQL** e execute o script [db.config](file:///c:/Users/aluno/OneDrive%20-%20SESISENAISP%20-%20Escolas/Documentos/hayc/1211/projeto-conclusao-blog/DB/db.config).
