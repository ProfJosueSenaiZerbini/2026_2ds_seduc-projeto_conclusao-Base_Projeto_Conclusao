"use client";

import { useState } from "react";
import Image from "next/image";

export default function ProfileMenu() {
    const [aberto, setAberto] = useState(false);

    function handleLogout() {
        {/* Criar a função de deslogar aquiiiiiiiiii */}
    }

    return (
        <div className="relative">

            <button 
                onClick={() => setAberto(!aberto)}
                className="rounded-full"
            >
                <Image
                    className="rounded-full"
                    src="/images/pfp.png"
                    alt="Foto de perfil do usuário."
                    width={60}
                    height={60}
                />
            </button>

            {aberto && (
                <>
                <div className="
                    absolute
                    right-[22px]
                    top-[64px]
                    w-0
                    h-0
                    border-l-8 border-l-transparent
                    border-r-8 border-r-transparent
                    border-b-8 border-b-white
                "/>
                
                <div className="
                    absolute right-0 mt-1
                    w-56
                    overflow-hidden
                    rounded-sm
                    bg-white
                    shadow-lg">

                    <a
                        href="/configuracoes"
                        className="
                            flex items-center gap-3
                            px-4 py-4
                            text-gray-700
                            hover:bg-gray-100
                        "
                    >
                        <span>⚙</span>
                        <span>Configurações Perfil</span>
                    </a>

                    <button
                    onClick={handleLogout}
                        className="
                            flex w-full items-center gap-3
                            border-t border-gray-200
                            px-4 py-4
                            text-left text-gray-700
                            hover:bg-gray-100
                        ">
                        <span>↪</span>
                        <span>Log out</span>
                    </button>

                </div>
                </>
            )}

        </div>
    );
}