import josudoLogo from "@assets/JOSUDO LOGO_1752483631486.png";

export const Header: React.FC = () => {
  return (
    <div className="px-3 py-3 relative z-10">
      <div className="flex items-center">
        <img 
          src={josudoLogo} 
          alt="Josudo" 
          className="h-48 w-auto object-contain opacity-90"
        />
      </div>
    </div>
  );
};
