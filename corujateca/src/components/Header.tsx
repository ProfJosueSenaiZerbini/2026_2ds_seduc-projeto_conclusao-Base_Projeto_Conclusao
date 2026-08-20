import Image from 'next/image';
import ProfileMenu from './ProfileMenu';

export default function Header() {
    return (
        <header className='flex justify-between items-center px-6 py-3 bg-[var(--brand-800)]'>
            
            <Image
                src="/images/logo_corujateca.png"
                alt="Corujateca:Logo do projeto."
                width={140}
                height={140}

                className='ml-9'
            />
            
            <ProfileMenu />

        </header>
    );
}