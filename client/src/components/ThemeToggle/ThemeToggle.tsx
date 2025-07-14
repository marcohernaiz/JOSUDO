import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="fixed top-2 right-2 z-50 p-2 rounded-full bg-white/10 dark:bg-black/10 backdrop-blur-sm hover:bg-white/20 dark:hover:bg-black/20 transition-all duration-200"
      aria-label="Toggle theme"
    >
      <span className="text-2xl">
        {theme === 'dark' ? '🌙' : '☀️'}
      </span>
    </Button>
  );
};