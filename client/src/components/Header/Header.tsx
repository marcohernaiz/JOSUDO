import josudoLogo from "@assets/WhatsApp Image 2025-07-09 at 17.09.39_1752073917749.jpeg";

export const Header: React.FC = () => {
  return (
    <div className="px-6 py-6 relative z-20">
      <div className="flex items-center">
        <img 
          src={josudoLogo} 
          alt="Josudo" 
          className="h-16 w-auto object-contain"
        />
      </div>
    </div>
  );
};
