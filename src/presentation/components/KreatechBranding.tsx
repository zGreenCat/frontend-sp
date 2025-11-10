import React from 'react';
import { cn } from '@/lib/utils';

interface KreatechHeroProps {
  children: React.ReactNode;
  className?: string;
  showGradient?: boolean;
}

/**
 * Componente Hero con el gradiente de marca Kreatech (Azul → Verde)
 * Usado principalmente en la página de Login
 */
export function KreatechHero({ 
  children, 
  className,
  showGradient = true 
}: KreatechHeroProps) {
  return (
    <div 
      className={cn(
        "min-h-screen w-full flex items-center justify-center p-4",
        showGradient && "bg-gradient-hero",
        !showGradient && "bg-background",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Componente de Card para usar dentro del Hero
 */
interface HeroCardProps {
  children: React.ReactNode;
  className?: string;
}

export function HeroCard({ children, className }: HeroCardProps) {
  return (
    <div 
      className={cn(
        "w-full max-w-md",
        "bg-card text-card-foreground",
        "rounded-2xl shadow-2xl",
        "p-8 md:p-10",
        "backdrop-blur-sm bg-white/95",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Logo placeholder de Kreatech
 */
export function KreatechLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
        <span className="text-white font-bold text-xl">K</span>
      </div>
      <span className="text-2xl font-bold text-foreground">Kreatech</span>
    </div>
  );
}

/**
 * Slogan de Kreatech
 */
export function KreatechSlogan({ className }: { className?: string }) {
  return (
    <p className={cn("text-muted-foreground text-center", className)}>
      Tecnología para el futuro
    </p>
  );
}
