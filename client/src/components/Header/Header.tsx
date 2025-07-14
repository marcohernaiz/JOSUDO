import josudoLogo from "@assets/JOSUDO LOGO_1752483099099.png";

export const Header: React.FC = () => {
  return (
    <div className="px-6 py-8 relative">
      <div className="flex items-center">
        <img 
          src={josudoLogo} 
          alt="Josudo" 
          className="h-48 w-auto object-contain opacity-30 absolute top-4 left-4 z-0"
        />
      </div>
    </div>
  );
};
