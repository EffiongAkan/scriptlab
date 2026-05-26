import React from "react";

export const LandingBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none select-none">
      {/* Deep base color */}
      <div className="absolute inset-0 bg-[#0a0a0a]" />
      
      {/* Cinematic background image */}
      <div 
        className="absolute inset-0 opacity-[0.2] bg-cover bg-center mix-blend-screen"
        style={{ 
          backgroundImage: `url('/assets/landing/cinematic_bg.png')`,
        }} 
      />
      
      {/* Decorative gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-naija-green/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-naija-gold/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] rounded-full bg-naija-green/5 blur-[100px]" />
      
      {/* Mesh grid pattern - very subtle dots */}
      <div 
        className="absolute inset-0 opacity-[0.05]" 
        style={{ 
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
          backgroundSize: '48px 48px' 
        }} 
      />
      
      {/* Vignette effect */}
      <div className="absolute inset-0 bg-radial-vignette opacity-70" />
    </div>
  );
};
