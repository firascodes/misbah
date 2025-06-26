"use client";

import { useState, useEffect, useCallback } from "react"; // Import useContext
import SearchBar from "@/components/SearchBar";
import { SearchHistoryPane } from "@/components/SearchHistoryPane";
import { useHistoryPane } from "@/context/HistoryPaneContext"; // Import the context hook

export default function Home() {
  const [displayText, setDisplayText] = useState("");
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed] = useState(100);

  const { isHistoryPaneOpen, toggleHistoryPane } = useHistoryPane(); // Use context state and functions
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");

  useEffect(() => {
    // Array of phrases to cycle through
    const phrases = [
      "Specific Hadith?",
      "Forgotten Sunnah?",
      "Prophetic Saying?"
    ];

    const currentPhrase = phrases[phraseIndex];

    // If we've finished typing the current phrase
    if (!isDeleting && displayText === currentPhrase) {
      // Wait a bit longer at the end of typing
      const pauseTime = 1800;
      setTimeout(() => setIsDeleting(true), pauseTime);
      return;
    }

    // If we've finished deleting the current phrase
    if (isDeleting && displayText === "") {
      setIsDeleting(false);
      // Move to the next phrase
      setPhraseIndex((prevIndex) => (prevIndex + 1) % phrases.length);
      // Wait a bit before starting to type again
      return;
    }

    // Set the interval for the next character update
    const interval = setTimeout(() => {
      setDisplayText(prev => {
        if (isDeleting) {
          // Delete one character
          return prev.substring(0, prev.length - 1);
        } else {
          // Add one character
          return currentPhrase.substring(0, prev.length + 1);
        }
      });
    }, isDeleting ? typingSpeed / 2 : typingSpeed); // Deleting is faster than typing

    return () => clearTimeout(interval);
  }, [displayText, isDeleting, phraseIndex, typingSpeed]);

  const handleSearch = useCallback((query: string) => {
    setCurrentSearchQuery(query);
    // Close the history pane when a history item is clicked
    if (isHistoryPaneOpen) {
        toggleHistoryPane(); // Use the toggle function from context
    }
  }, [isHistoryPaneOpen, toggleHistoryPane]); // Add dependencies

  return (
    <main className="flex flex-col items-center justify-center px-4 py-8 space-y-10 relative">
      <div className="flex flex-col items-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-semibold text-center max-w-xl h-16 sm:h-12">
        Looking For A {displayText}
          <span className="animate-blink">|</span>
        </h2>
        <p className="text-md text-muted-foreground text-center max-w-xl">
          Search for teachings of Prophet Muhammad (SAW) using AI assistance by either natural language or voice commands.
        </p>
      </div>
      <SearchBar
        triggerSearchQuery={currentSearchQuery}
        onSearchPerformed={() => setCurrentSearchQuery("")}
      />
      <SearchHistoryPane
        isOpen={isHistoryPaneOpen}
        onOpenChange={toggleHistoryPane} // Use context toggle for closing via sheet overlay/button
        onSearch={handleSearch}
      />
    </main>
  );
}