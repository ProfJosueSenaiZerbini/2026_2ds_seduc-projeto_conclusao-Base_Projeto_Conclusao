import React from 'react';
import PolaroidCard from '../ui/PolaroidCard';
import Stamp from '../ui/Stamp';
import Sparkle from '../ui/Sparkle';

const PolaroidCollage = () => {
  return (
    <div className="relative w-full min-h-[500px] sm:min-h-[580px] md:min-h-[640px] lg:min-h-[680px]">

      {/* ──── Polaroid 1: Central/Superior (Fashion/Magazine) ──── */}
      <div className="absolute top-0 left-4 sm:left-8 lg:left-4 z-20">
        <PolaroidCard
          image="https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=540&fit=crop&crop=faces"
          caption="LUMINA · MODA · 2026"
          rotation={-3}
          className="w-52 sm:w-60 md:w-64"
        >
          <Stamp text={`EDIÇÃO\nESPECIAL`} className="-bottom-2 -right-2" color="red" size="md" />
        </PolaroidCard>
      </div>

      {/* ──── Polaroid 2: Right (Book / Valentine) ──── */}
      <div className="absolute top-6 sm:top-10 right-0 sm:right-2 z-30">
        <PolaroidCard
          image="https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=540&fit=crop"
          caption="LITERATURA"
          rotation={4}
          className="w-44 sm:w-52 md:w-56"
        >
          {/* Red badge bottom */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-red-editorial text-white text-[7px] sm:text-[8px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm whitespace-nowrap shadow-md z-30">
            EM DESTAQUE: Arte que transforma.
          </div>
        </PolaroidCard>
      </div>

      {/* ──── Polaroid 3: Center/Bottom (Portrait) ──── */}
      <div className="absolute bottom-16 sm:bottom-10 left-10 sm:left-16 lg:left-12 z-10">
        <PolaroidCard
          image="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop&crop=faces"
          caption="RETRATO · ARTES VISUAIS"
          rotation={2}
          className="w-48 sm:w-56 md:w-60"
        />
      </div>

      {/* ──── Film Strip: Bottom Right ──── */}
      <div
        className="polaroid film-strip absolute bottom-0 right-2 sm:right-6 w-20 sm:w-24 rounded-sm shadow-xl z-40 p-0"
        style={{ transform: 'rotate(-2deg)' }}
      >
        <div className="flex flex-col gap-0.5 py-1.5 px-5">
          {[
            "1507924538820-ede94a04019d",
            "1503095396549-807759245b35",
            "1460723237483-7a6dc9d0b212",
            "1514306191717-452ec28c7814"
          ].map((id, index) => (
            <div key={index} className="w-full aspect-[4/3] overflow-hidden">
              <img
                src={`https://images.unsplash.com/photo-${id}?w=200&h=150&fit=crop`}
                alt={`Theater ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* "LEIA JÁ" black stamp */}
        <Stamp text={`LEIA\nJÁ`} className="-bottom-4 -left-5" color="black" size="sm" />
      </div>

      {/* ──── Decorative Elements ──── */}
      <Sparkle className="absolute top-2 right-1/3 text-red-editorial text-lg z-0" delay={0.3} />
      <Sparkle className="absolute bottom-32 left-0 text-red-editorial text-sm z-0" delay={1} char="+" />
      <Sparkle className="absolute top-1/2 right-0 text-gray-400 text-xs z-0" delay={1.5} />
      <Sparkle className="absolute bottom-8 left-1/3 text-red-editorial/40 text-2xl z-0" delay={0.8} />

    </div>
  );
};

export default PolaroidCollage;

