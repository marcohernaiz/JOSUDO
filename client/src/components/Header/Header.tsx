import josudoLogo from "@assets/image_1752073671077.png";

export const Header: React.FC = () => {
  return (
    <div className="px-6 py-4 relative z-20">
      <div className="flex items-center">
        <img 
          src={josudoLogo} 
          alt="Josudo" 
          className="h-8 w-auto object-contain"
        />
      </div>
    </div>
  );
};
