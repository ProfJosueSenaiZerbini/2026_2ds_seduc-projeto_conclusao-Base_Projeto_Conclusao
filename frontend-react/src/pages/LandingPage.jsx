import React, { useEffect } from 'react';
import HeroSection from '../components/home/HeroSection';
import PolaroidCollage from '../components/home/PolaroidCollage';

const LandingPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full">
      {/* HERO SECTION - Apresentação Pública */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          <HeroSection />
          <PolaroidCollage />
        </div>
      </section>
      
      {/* Aqui você poderia adicionar mais seções públicas como Pricing, Features, etc. */}
    </div>
  );
};

export default LandingPage;

