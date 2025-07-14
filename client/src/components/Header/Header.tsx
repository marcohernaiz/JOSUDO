import josudoLogo from "@assets/JOSUDO LOGO_1752483099099.png";

export const Header: React.FC = () => {
  return (
    <div className="px-6 py-8 relative z-20">
      <div className="flex items-center">
        <img 
          src={josudoLogo} 
          alt="Josudo" 
          className="h-32 w-auto object-contain"
        />
      </div>
    </div>
  );
};
