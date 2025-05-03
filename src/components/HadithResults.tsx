"use client";

import { HadithCard } from "@/components/HadithCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { Tables } from "@/lib/database.types"; // Import Tables type

// Export the type so it can be imported elsewhere
export type HadithResult = Pick<
  Tables<'hadiths'>,
  'id' | 'text_ar' | 'text_en' | 'source' | 'chapter' | 'chapter_no' | 'hadith_no' | 'hadith_id'
> & {
  reference_number?: string; // Keep optional based on API response
};

interface HadithResultsProps {
  results: HadithResult[] | null;
  query: string;
  isLoading: boolean;
  error: string | null;
}

export function HadithResults({ results, query, isLoading, error }: HadithResultsProps) {
  if (isLoading) {
    return (
      <div className="py-8 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!results) {
    return null;
  }

  if (results.length === 0) {
    return (
      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>No Results</AlertTitle>
        <AlertDescription>
          No hadiths found matching `{query}`. Please try different keywords or check your spelling.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-2">
      <div className="mb-2 justify-end w-full px-2 flex">
        <h2 className="text-lg font-semibold">
          {results.length} Result{results.length !== 1 ? 's' : ''}
        </h2>
      </div>
      
      {results.map((hadith) => (
        <HadithCard key={hadith.id} hadith={hadith} />
      ))}
    </div>
  );
}