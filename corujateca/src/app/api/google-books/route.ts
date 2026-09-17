import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isbn = searchParams.get('isbn')?.replace(/[^0-9X]/gi, '');

    if (!isbn) {
      return NextResponse.json(
        { erro: 'O parâmetro ISBN é obrigatório.' },
        { status: 400 }
      );
    }

    // 🇧🇷 1. Fonte Principal: BRASIL API (Dados oficiais da CBL / ISBN Brasil)
    try {
      const brasilApiRes = await fetch(
        `https://brasilapi.com.br/api/isbn/v1/${isbn}`
      );

      if (brasilApiRes.ok) {
        const dadosBrasil = await brasilApiRes.json();

        // Trata autores da Brasil API (que vêm em array)
        const autores = Array.isArray(dadosBrasil.authors)
          ? dadosBrasil.authors.join(', ')
          : dadosBrasil.authors || '';

        return NextResponse.json(
          {
            isbn,
            titulo_livro: dadosBrasil.title || '',
            autor_livro: autores,
            editora_livro: dadosBrasil.publisher || '',
            anopub_livro: dadosBrasil.year || new Date().getFullYear(),
            genero_livro: dadosBrasil.subjects ? dadosBrasil.subjects[0] : 'Literatura',
            imgcapa_livro: dadosBrasil.cover_url || '',
            sinopse_livro: dadosBrasil.synopsis || '',
          },
          { status: 200 }
        );
      }
    } catch (errBrasil) {
      console.warn('Brasil API não respondeu, tentando Google Books...', errBrasil);
    }

    // 🌐 2. Plano B: Google Books API (Para livros internacionais)
    const googleRes = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
    );

    if (googleRes.ok) {
      const googleData = await googleRes.json();

      if (googleData.items && googleData.items.length > 0) {
        const info = googleData.items[0].volumeInfo;

        return NextResponse.json(
          {
            isbn,
            titulo_livro: info.title || '',
            autor_livro: info.authors ? info.authors.join(', ') : '',
            editora_livro: info.publisher || '',
            anopub_livro: info.publishedDate
              ? new Date(info.publishedDate).getFullYear()
              : new Date().getFullYear(),
            genero_livro: info.categories ? info.categories[0] : 'Geral',
            imgcapa_livro:
              info.imageLinks?.thumbnail?.replace('http://', 'https://') || '',
            sinopse_livro: info.description || '',
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json(
      { erro: 'Nenhum livro foi localizado com este ISBN nas bases oficiais.' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Erro na consulta do ISBN:', error);
    return NextResponse.json(
      { erro: 'Erro interno ao consultar serviços de ISBN.' },
      { status: 500 }
    );
  }
}