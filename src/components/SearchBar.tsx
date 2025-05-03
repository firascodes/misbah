"use client";

import { useState, useRef, useEffect, useContext } from "react"; // Import useEffect, useContext
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Mic, MicOff, Search, X } from "lucide-react";
import { HadithResults } from "./HadithResults";
import { PresetButtons } from "./PresetButtons";
import { SupabaseContext } from "@/app/providers"; // Import Supabase context

// Define the Speech Recognition interface and related event types
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void; // Use specific event type
  onerror: (event: SpeechRecognitionErrorEvent) => void; // Use specific event type
  onend: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
}

// Declare the global SpeechRecognition constructors
interface SpeechRecognitionWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// Export HadithResult type if it's used in PresetButtons
export interface HadithResult {
  id: number;
  arabic_text: string;
  english_translation: string;
  reference_number: string;
  source_book: string;
}

// Add props for external search trigger and callback
interface SearchBarProps {
  triggerSearchQuery?: string;
  onSearchPerformed?: () => void;
}

export default function SearchBar({ triggerSearchQuery, onSearchPerformed }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HadithResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [showPresetButtons, setShowPresetButtons] = useState(true);
  const { session } = useContext(SupabaseContext); // Get session from context

  // Effect to handle externally triggered search
  useEffect(() => {
    if (triggerSearchQuery) {
      setQuery(triggerSearchQuery); // Update input field
      performSearch(triggerSearchQuery);
      onSearchPerformed?.(); // Notify parent that search was triggered
    }
    // Intentionally not depending on performSearch to avoid re-trigger loops if performSearch changes identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerSearchQuery, onSearchPerformed]); // Dependency array includes the trigger prop

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(query);
  };

  // Function to save search history
  const saveSearchHistory = async (searchQuery: string) => {
    if (!session) return; // Only save if logged in

    try {
      const response = await fetch('/api/history/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ queryText: searchQuery }),
      });
      if (!response.ok) {
          console.warn('Failed to save search history:', response.statusText);
      }
      // No need to handle response unless there's specific feedback needed
    } catch (err) {
      console.error("Failed to save search history:", err);
      // Optionally notify user or log error
    }
  };

  const performSearch = async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;

    setIsLoading(true);
    setResults(null);
    setError(null);
    setShowPresetButtons(false);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: trimmedQuery }), // Use trimmed query
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: HadithResult[] = await response.json();
      setResults(data);

      // Save history AFTER a successful search
      await saveSearchHistory(trimmedQuery);

    } catch (err: unknown) {
      console.error("Search failed:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred during search.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      startListening();
    }
  };

  const startListening = () => {
    // Check if speech recognition is supported
    if (typeof window === 'undefined') return;

    // Use a type assertion for the window object
    const SpeechRecognitionAPI = (
      (window as SpeechRecognitionWindow).SpeechRecognition || 
      (window as SpeechRecognitionWindow).webkitSpeechRecognition
    );
    
    if (!SpeechRecognitionAPI) {
      setError("Your browser doesn't support speech recognition. Please try Chrome or Edge.");
      return;
    }

    recognitionRef.current = new SpeechRecognitionAPI();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US'; // Set language; can be made configurable

    recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => { // Use specific event type
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      // Auto search when voice input is complete
      setIsListening(false);

      performSearch(transcript);
    };

    recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => { // Use specific event type
      console.error('Speech recognition error', event.error, event.message);
      setIsListening(false);
      setError(`Speech recognition error: ${event.error}. Please try again.`);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
    setIsListening(true);
  };

  // New function to clear search results
  const handleClear = () => {
    setQuery("");
    setResults(null);
    setError(null);
    setShowPresetButtons(true); // Show preset buttons when cleared
  };

  return (
    <div className="w-full max-w-7xl">
      <div className="w-full max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="flex items-center w-full space-x-2 h-12 mb-4">
          <div className="relative flex-grow">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for Hadiths..."
              className="w-full px-6 py-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || isListening}
            />
            {isListening && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="flex items-center justify-center h-4 w-4">
                  <div className="animate-pulse h-3 w-3 rounded-full bg-red-500"></div>
                </div>
              </div>
            )}
          </div>
          
          <Button 
            type="submit" 
            variant="default" 
            disabled={isLoading || isListening}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span>Searching</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Search</span>
              </>
            )}
          </Button>
          
          <Button 
            type="button" 
            variant={isListening ? "destructive" : "outline"}
            onClick={toggleListening}
            className="flex items-center gap-2"
            disabled={isLoading}
          >
            {isListening ? (
              <>
                <MicOff className="h-4 w-4" />
                <span>Stop</span>
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                <span>Voice</span>
              </>
            )}
          </Button>

          {results && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClear}
              className="flex items-center gap-2"
              disabled={isLoading || isListening || (!query && !results)}
            >
              <X className="h-4 w-4" />
              <span>Clear</span>
            </Button>
          )}
        </form>

      </div>

      <div className="flex justify-center items-center py-4 flex-col">
        {/* Hide when loading or when query is not empty */}
        {showPresetButtons && !query && (<p className="font-semibold">
          Topics
        </p>
        )}
        <PresetButtons
          showPresetButtons={showPresetButtons}
          query={query}
          results={results}
          onPresetClick={(topic) => {
            setQuery(topic);
            performSearch(topic);
          }}
          />
      </div>
      
      {isListening && (
        <div className="text-center mt-4 text-blue-600">
          Listening... Speak now
        </div>
      )}

      <div className="mt-6">
        <HadithResults
          results={results}
          query={query}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}