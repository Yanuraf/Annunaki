import React, { useState, useEffect, useCallback } from 'react';
import { startChat, getNextStep, generateImage } from './services/geminiService';
import { INITIAL_PROMPT } from './constants';
import type { GameState, Choice, GameResponse } from './types';
import { useTypewriter } from './hooks/useTypewriter';
import LoadingIcon from './components/icons/LoadingIcon';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    story: '',
    choices: [],
    isLoading: true,
    error: null,
  });
  const [backgroundImage, setBackgroundImage] = useState<string>('');

  const { displayText: displayedStory, isFinished: storyFinished } = useTypewriter(gameState.story);

  const processGameStep = useCallback(async (gameResponse: GameResponse) => {
    setGameState({
      story: gameResponse.story,
      choices: gameResponse.choices,
      isLoading: false,
      error: null,
    });

    if (gameResponse.imagePrompt) {
      // Don't await this; let the image load in the background
      generateImage(gameResponse.imagePrompt).then(newImageUrl => {
        if (newImageUrl) {
          setBackgroundImage(newImageUrl);
        }
      });
    }
  }, []);

  const startGame = useCallback(async () => {
    setGameState({ story: '', choices: [], isLoading: true, error: null });
    setBackgroundImage(''); // Reset background on new game
    try {
      startChat();
      const firstStep = await getNextStep(INITIAL_PROMPT);
      await processGameStep(firstStep);
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error("Initialization failed:", error);
      setGameState({
        story: 'Failed to initialize the narrative engine. The connection to the ancient archives is severed.',
        choices: [],
        isLoading: false,
        error: error,
      });
    }
  }, [processGameStep]);

  useEffect(() => {
    startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChoice = async (choice: Choice) => {
    if (gameState.isLoading) return;

    setGameState(prev => ({ ...prev, isLoading: true, choices: [] }));

    try {
      const nextStep = await getNextStep(choice.action);
      await processGameStep(nextStep);
    } catch (e) {
      const error = e instanceof Error ? e.message : 'An unknown error occurred.';
      console.error("Failed to process choice:", error);
      setGameState(prev => ({
        ...prev,
        story: 'A powerful force resists your inquiry. The path forward is blocked by an unseen barrier.',
        isLoading: false,
        error: error,
        choices: [{text: "Try again", action: choice.action}]
      }));
    }
  };

  return (
    <div className="relative bg-slate-900 min-h-screen text-amber-200 p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center selection:bg-cyan-400 selection:text-slate-900 overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle, #1e293b, #0f172a, #020617)' }}>
      {/* Dynamic Background Image */}
      <div
        key={backgroundImage}
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
          animation: backgroundImage ? 'fade-in-bg-anim 2s ease-in forwards' : 'none',
          opacity: 0,
        }}
      />
      {/* Dark Overlay for Readability */}
      <div className="absolute inset-0 w-full h-full bg-black/70"></div>
      
      <main className="relative z-10 w-full max-w-3xl mx-auto bg-black bg-opacity-40 rounded-lg shadow-2xl shadow-cyan-500/10 ring-1 ring-slate-700 p-6 md:p-8 flex flex-col gap-6">
        <header className="text-center border-b-2 border-amber-500/20 pb-4">
          <h1 className="font-orbitron text-2xl sm:text-3xl md:text-4xl font-bold text-amber-300 tracking-widest uppercase">
            Annunaki Chronicles
          </h1>
          <p className="text-cyan-400 text-sm mt-1">The Nibiru Conspiracy</p>
        </header>

        <section id="story-panel" className="flex-grow min-h-[200px] text-lg leading-relaxed text-amber-100/90 whitespace-pre-wrap">
          {gameState.isLoading && !gameState.story ? <div className="flex justify-center items-center h-full"><LoadingIcon /></div> : displayedStory}
          {storyFinished && <span className="inline-block w-2 h-5 bg-amber-200 animate-pulse ml-1" aria-hidden="true" />}
        </section>

        <section id="choice-panel" className="min-h-[100px]">
          {gameState.isLoading && gameState.story ? (
             <div className="flex justify-center items-center h-full">
               <div className="flex items-center gap-4">
                 <LoadingIcon />
                 <span className="text-cyan-400">Awaiting chronal-data stream...</span>
               </div>
             </div>
          ) : (
            storyFinished && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                {gameState.choices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => handleChoice(choice)}
                    disabled={gameState.isLoading}
                    className="w-full text-left p-4 bg-slate-800/50 hover:bg-slate-700/70 border border-cyan-500/30 hover:border-cyan-400 rounded-md transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-cyan-300 font-bold">{`> `}</span>{choice.text}
                  </button>
                ))}
              </div>
            )
          )}
        </section>

        {gameState.error && (
            <div className="mt-4 p-3 bg-red-900/50 border border-red-500 text-red-300 rounded-md text-sm">
                <strong>System Alert:</strong> {gameState.error}
            </div>
        )}
      </main>
      <footer className="relative z-10 text-center mt-8 text-slate-500 text-xs">
          <p>Powered by Gemini. Narrative crafted by a rogue AI.</p>
          <p>Theories based on the works of Sitchin, Biglino, Hancock, and von Däniken.</p>
      </footer>
    </div>
  );
};

export default App;