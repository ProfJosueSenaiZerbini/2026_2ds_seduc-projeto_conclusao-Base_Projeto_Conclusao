import Image from 'next/image';
import ProfileMenu from './ProfileMenu';

export default function Header() {
    return (
        <header className="
            h-32
            flex
            items-center
            justify-between
            px-6
            bg-[var(--brand-800)]
        ">

            <Image
                src="/images/logo_corujateca.png"
                alt="Corujateca: Logo do projeto."
                width={140}
                height={140}
                className="ml-9"
            />

            <ProfileMenu />

        </header>
    );
}
