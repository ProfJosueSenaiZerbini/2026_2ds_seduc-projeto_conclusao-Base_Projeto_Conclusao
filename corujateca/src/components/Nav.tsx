"use client";

import NavBibliotecario from "./NavBibliotecario";
import NavFrequentador from "./NavFrequentador";

export default function Nav() {

    {/* Por enquanto estamos simulando o usuário logado.
        Depois isso vai ter que vir da autenticação. */}
    const usuario = "frequentador";

    if (usuario === "frequentador") {
        return <NavFrequentador />;
    }

    if (usuario === "bibliotecario") {
        return <NavBibliotecario />;
    }

    return null;
}