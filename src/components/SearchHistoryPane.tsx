'use client';

import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming scroll-area is added or will be
import { formatDistanceToNow } from 'date-fns'; // For relative timestamps

interface SearchHistoryItem {
  id: number;
  query_text: string;
  timestamp: string; // ISO string from Supabase
}

interface SearchHistoryPaneProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSearch: (query: string) => void;
}

export function SearchHistoryPane({ isOpen, onOpenChange, onSearch }: SearchHistoryPaneProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch('/api/history/retrieve');
          if (!response.ok) {
            if (response.status === 401) {
              setError('Please log in to view search history.');
              setHistory([]); // Clear history if user logs out while pane is open
            } else {
              throw new Error(`Failed to fetch history: ${response.statusText}`);
            }
          } else {
            const data: SearchHistoryItem[] = await response.json();
            setHistory(data);
          }
        } catch (err) {
          console.error(err);
          setError('An error occurred while fetching history.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchHistory();
    }
  }, [isOpen]); // Re-fetch when the pane is opened

  const handleHistoryClick = (query: string) => {
    onSearch(query);
    onOpenChange(false); // Close pane after clicking history item
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Search History</SheetTitle>
          <SheetDescription>
            Your recent searches. Click an item to search again.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-grow overflow-hidden"> {/* Added flex-grow and overflow-hidden */}
          <ScrollArea className="h-full pr-4"> {/* Added h-full */}
            {isLoading && <p className="text-center text-muted-foreground">Loading history...</p>}
            {error && <p className="text-center text-destructive">{error}</p>}
            {!isLoading && !error && history.length === 0 && (
              <p className="text-center text-muted-foreground">No search history found.</p>
            )}
            {!isLoading && !error && history.length > 0 && (
              <ul className="space-y-2">
                {history.map((item) => (
                  <li key={item.id}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto py-2 px-3 text-left flex flex-col items-start"
                      onClick={() => handleHistoryClick(item.query_text)}
                    >
                      <span className="font-medium truncate block w-full">{item.query_text}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                      </span>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </div>
        <SheetFooter className="mt-auto pt-4"> {/* Added mt-auto */}
          <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
