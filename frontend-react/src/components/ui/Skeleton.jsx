import React from 'react';

const Skeleton = ({ variant = 'text', className = '' }) => {
  const baseClasses = "animate-pulse bg-gray-300/50 rounded-sm";
  
  const variants = {
    text: "h-4 w-full",
    title: "h-8 w-3/4",
    image: "w-full aspect-[3/4]",
    card: "w-full h-full",
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`}></div>
  );
};

export const PolaroidSkeleton = () => (
  <div className="polaroid w-full bg-white p-2.5 pb-10 shadow-xl relative z-10">
    <div className="relative overflow-hidden aspect-[3/4] mb-3">
      <Skeleton variant="card" />
    </div>
    <div className="space-y-2 px-1">
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-2/3 mx-auto" />
    </div>
  </div>
);

export default Skeleton;

