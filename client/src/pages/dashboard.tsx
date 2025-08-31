import { useIsMobile } from "@/hooks/use-mobile";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Header } from "@/components/Header/Header";
import { ChatArea } from "@/components/Chat/ChatArea";
import { MessageInput } from "@/components/Chat/MessageInput";
import { HeroSection } from "@/components/Hero/HeroSection";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useChat } from "@/hooks/useChat";
import { useAppContext } from "@/contexts/AppContext";
import sophiaBackground from "@assets/Sophia background_1752487018233.png";
import executiveAssistantGif from "@assets/Executive Assistant_1756066904884.gif";
import salesMarketingGif from "@assets/Sales & Marketing_1756066904883.gif";
import customerSupportGif from "@assets/Customer Support_1756066904882.gif";
import elderlyCareGif from "@assets/Elderly Care_1756066904884.gif";
import digitalBuddyGif from "@assets/Digital Buddy_1756066904884.gif";
import aiGirlfriendGif from "@assets/AI Girlfriend GIF_1756066904885.gif";
import { DigitalPersonasSection } from "@/components/DigitalPersonas/DigitalPersonasSection";
import { SpacesSection } from "@/components/Spaces/SpacesSection";
import { SpaceWorkspace } from "@/components/Spaces/SpaceWorkspace";
import { Space } from "@/types";

export default function Dashboard() {
  const isMobile = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme } = useTheme();
  const { messages } = useChat();
  const { activeSection, setActiveSection, currentSpace, setCurrentSpace } = useAppContext();

  // Function to handle section switching
  const handleSwitchToChat = () => {
    setActiveSection('chat');
  };

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  const handleSpaceSelect = (spaceId: number) => {
    // Find the space by ID and set it as current
    const space = { id: spaceId, name: spaceId === 1 ? 'My Personal Space' : 'My Workspace', userId: 1 };
    setCurrentSpace(space);
    setActiveSection('spaces');
  };

  return (
    <div className="h-screen w-full bg-white dark:bg-black overflow-hidden">
      <div
        className="h-full w-full flex relative"
        style={theme === 'dark' ? {
          backgroundImage: `url(${sophiaBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        } : {}}
      >
        {/* Theme overlay - only in dark mode */}
        {theme === 'dark' && <div className="absolute inset-0 bg-black/5"></div>}
        {/* Mobile Menu Toggle */}
        {isMobile && (
          <Button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="fixed top-4 left-4 z-50 bg-white/90 backdrop-blur-sm shadow-lg border border-gray-300 hover:bg-gray-50/90 w-12 h-12 p-0 flex items-center justify-center"
            variant="outline"
            size="sm"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
            >
              <path 
                d="M12 2C8.5 2 8.5 6 12 6C15.5 6 15.5 2 12 2ZM6 8C2.5 8 2.5 12 6 12C9.5 12 9.5 8 6 8ZM18 8C14.5 8 14.5 12 18 12C21.5 12 21.5 8 18 8ZM12 14C8.5 14 8.5 18 12 18C15.5 18 15.5 14 12 14Z" 
                fill="currentColor"
              />
            </svg>
          </Button>
        )}

        {/* Desktop Sidebar - Always visible */}
        {!isMobile && (
          <div className="fixed inset-y-0 left-0 z-40">
            <div className={`h-full border-r shadow-xl transition-all duration-200 ${
              theme === 'dark'
                ? 'bg-slate-900/90 backdrop-blur-md border-slate-700/50'
                : 'bg-white border-slate-200'
            }`}>
              <Sidebar onClose={() => setIsSidebarOpen(false)} onSwitchToChat={handleSwitchToChat} onSectionChange={handleSectionChange} onSpaceSelect={handleSpaceSelect} activeSection={activeSection} currentSpace={currentSpace} />
            </div>
          </div>
        )}

        {/* Mobile Sidebar */}
        {isMobile && (
          <div
            className={`
              ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
              fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out
            `}
          >
            <div className={`h-full border-r shadow-xl ${
              theme === 'dark'
                ? 'bg-slate-900/90 backdrop-blur-md border-slate-700/50'
                : 'bg-white border-slate-200'
            }`}>
              <Sidebar onClose={() => setIsSidebarOpen(false)} onSwitchToChat={handleSwitchToChat} onSectionChange={handleSectionChange} onSpaceSelect={handleSpaceSelect} activeSection={activeSection} currentSpace={currentSpace} />
            </div>
          </div>
        )}

        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Subtle overlay and animations - only in dark mode */}
        {theme === 'dark' && <div className="absolute inset-0 bg-black/20 z-10"></div>}

        {/* Cyberpunk Universe Stars Animation - only in dark mode */}
        {theme === 'dark' && <div className="absolute inset-0 z-20 pointer-events-none">
          {/* Moving Stars Layer 1 */}
          <div
            className="w-full h-full"
            style={{
              background: `
              radial-gradient(1px 1px at 5% 10%, rgba(0, 255, 255, 0.8), transparent),
              radial-gradient(2px 2px at 15% 25%, rgba(255, 0, 255, 0.6), transparent),
              radial-gradient(1px 1px at 25% 40%, rgba(0, 255, 255, 0.7), transparent),
              radial-gradient(1px 1px at 35% 60%, rgba(255, 255, 0, 0.5), transparent),
              radial-gradient(2px 2px at 45% 15%, rgba(0, 255, 255, 0.8), transparent),
              radial-gradient(1px 1px at 55% 80%, rgba(255, 0, 255, 0.6), transparent),
              radial-gradient(1px 1px at 65% 35%, rgba(0, 255, 255, 0.7), transparent),
              radial-gradient(2px 2px at 75% 55%, rgba(255, 255, 0, 0.5), transparent),
              radial-gradient(1px 1px at 85% 75%, rgba(0, 255, 255, 0.8), transparent),
              radial-gradient(1px 1px at 95% 20%, rgba(255, 0, 255, 0.6), transparent)
            `,
              backgroundSize:
                "400px 300px, 300px 400px, 500px 200px, 250px 350px, 350px 250px, 400px 300px, 300px 400px, 500px 200px, 250px 350px, 350px 250px",
              animation:
                "starsMove 40s linear infinite, starsGlow 8s ease-in-out infinite",
            }}
          ></div>

          {/* Moving Stars Layer 2 */}
          <div
            className="w-full h-full"
            style={{
              background: `
              radial-gradient(1px 1px at 10% 30%, rgba(64, 224, 208, 0.6), transparent),
              radial-gradient(1px 1px at 20% 60%, rgba(138, 43, 226, 0.5), transparent),
              radial-gradient(2px 2px at 30% 20%, rgba(30, 144, 255, 0.7), transparent),
              radial-gradient(1px 1px at 40% 70%, rgba(64, 224, 208, 0.4), transparent),
              radial-gradient(1px 1px at 50% 40%, rgba(138, 43, 226, 0.6), transparent),
              radial-gradient(2px 2px at 60% 80%, rgba(30, 144, 255, 0.5), transparent),
              radial-gradient(1px 1px at 70% 50%, rgba(64, 224, 208, 0.7), transparent),
              radial-gradient(1px 1px at 80% 10%, rgba(138, 43, 226, 0.4), transparent),
              radial-gradient(2px 2px at 90% 90%, rgba(30, 144, 255, 0.6), transparent)
            `,
              backgroundSize:
                "350px 250px, 450px 350px, 300px 200px, 400px 300px, 250px 400px, 350px 250px, 450px 350px, 300px 200px, 400px 300px",
              animation:
                "starsMove 60s linear infinite reverse, cyberPulse 12s ease-in-out infinite",
            }}
          ></div>

          {/* Cyberpunk Grid Overlay */}
          <div
            className="w-full h-full"
            style={{
              background: `
              linear-gradient(90deg, transparent 49%, rgba(0, 255, 255, 0.1) 50%, transparent 51%),
              linear-gradient(0deg, transparent 49%, rgba(255, 0, 255, 0.1) 50%, transparent 51%)
            `,
              backgroundSize: "100px 100px, 150px 150px",
              animation: "gridMove 20s linear infinite",
            }}
          ></div>

          {/* Subtle particle effects */}
          <div
            className="w-full h-full"
            style={{
              background: `
              radial-gradient(1px 1px at 12% 22%, rgba(64, 224, 208, 0.2), transparent),
              radial-gradient(1px 1px at 32% 42%, rgba(138, 43, 226, 0.15), transparent),
              radial-gradient(1px 1px at 52% 12%, rgba(30, 144, 255, 0.18), transparent),
              radial-gradient(1px 1px at 72% 32%, rgba(64, 224, 208, 0.15), transparent),
              radial-gradient(1px 1px at 92% 52%, rgba(138, 43, 226, 0.2), transparent),
              radial-gradient(1px 1px at 22% 72%, rgba(30, 144, 255, 0.15), transparent),
              radial-gradient(1px 1px at 42% 92%, rgba(64, 224, 208, 0.18), transparent),
              radial-gradient(1px 1px at 82% 82%, rgba(138, 43, 226, 0.15), transparent)
            `,
              backgroundSize:
                "300px 200px, 400px 300px, 250px 150px, 350px 250px, 300px 200px, 400px 300px, 250px 150px, 350px 250px",
              animation: "particleFlow 30s linear infinite",
            }}
          ></div>
        </div>}

        {/* Main Content - Responsive layout based on screen size */}
        <div
          className={`flex-1 flex flex-col relative z-30 w-full overflow-hidden ${!isMobile ? 'chat-main-content' : ''}`}
        >
          {/* Scrollable content area */}
          <div className="flex-1 overflow-auto">
            {/* Digital Personas Section */}
            {activeSection === 'digital-personas' && (
              <div className="bg-white h-full">
                <DigitalPersonasSection />
              </div>
            )}

            {/* Chat Section */}
            {activeSection === 'chat' && (
              <>
                {/* Section 2: Hero Section - Only show when no messages */}
                {messages.length === 0 && (
                  <div className="bg-white">
                    <HeroSection />
                  </div>
                )}

                {/* Section 3: Chat Box Section */}
                {messages.length > 0 && (
                  <div className="bg-white">
                    <div className="w-full max-w-4xl mx-auto px-4">
                      <div className="flex flex-col min-h-screen">
                        <div className="flex-1">
                          <ChatArea />
                        </div>
                        <div className="flex-shrink-0 py-4">
                          <MessageInput />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* MessageInput for new conversations - bottom positioned */}
                {messages.length === 0 && <MessageInput />}
              </>
            )}
            
            {/* Other sections can be added here */}
            {activeSection === 'knowledge-base' && (
              <div className="bg-white h-full p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Knowledge Base</h1>
                <p className="text-gray-600">Coming soon...</p>
              </div>
            )}
            
            {activeSection === 'spaces' && (
              <>
                {currentSpace ? (
                  <SpaceWorkspace 
                    space={currentSpace} 
                    onBack={() => setCurrentSpace(null)} 
                  />
                ) : (
                  <SpacesSection 
                    onSpaceSelect={(space) => setCurrentSpace(space)} 
                  />
                )}
              </>
            )}
            
            {activeSection === 'tools' && (
              <div className="bg-white h-full p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Tools</h1>
                <p className="text-gray-600">Coming soon...</p>
              </div>
            )}

            {/* Section 4: Virtual Employees Section - Only show when no messages and on chat page */}
            {messages.length === 0 && activeSection === 'chat' && (
              <div className="bg-white py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Left Section - Hire Virtual Employees */}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Hire Virtual Employees</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { 
                            title: "Executive Assistant", 
                            description: "",
                            gif: executiveAssistantGif
                          },
                          { 
                            title: "Sales & Marketing", 
                            description: "",
                            gif: salesMarketingGif
                          },
                          { 
                            title: "Customer Support", 
                            description: "",
                            gif: customerSupportGif
                          }
                        ].map((item, index) => (
                          <div key={index} onClick={() => handleSectionChange('digital-personas')} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                            <div className="w-full">
                              <img 
                                src={item.gif}
                                alt={item.title}
                                className="w-full h-auto object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.parentElement?.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-md items-center justify-center hidden">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-lg font-bold">{item.title.charAt(0)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="p-2">
                              <h3 className="font-medium text-gray-900 text-xs text-center">{item.title}</h3>
                              {item.description && <p className="text-xs text-gray-600 leading-tight text-center">{item.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Section - Other Digital Personas */}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">Other Digital Personas</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          { 
                            title: "Elderly Care", 
                            description: "",
                            gif: elderlyCareGif
                          },
                          { 
                            title: "Digital Buddy", 
                            description: "",
                            gif: digitalBuddyGif
                          },
                          { 
                            title: "AI Girlfriend", 
                            description: "",
                            gif: aiGirlfriendGif
                          }
                        ].map((item, index) => (
                          <div key={index} onClick={() => handleSectionChange('digital-personas')} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                            <div className="w-full">
                              <img 
                                src={item.gif}
                                alt={item.title}
                                className="w-full h-auto object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.parentElement?.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              <div className="w-full h-32 bg-gradient-to-br from-green-100 to-blue-100 rounded-md items-center justify-center hidden">
                                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-lg font-bold">{item.title.charAt(0)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="p-2">
                              <h3 className="font-medium text-gray-900 text-xs text-center">{item.title}</h3>
                              {item.description && <p className="text-xs text-gray-600 leading-tight text-center">{item.description}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}