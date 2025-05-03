// PresetButtons.tsx
import { Button } from "./ui/button";
// Import HadithResult from HadithResults.tsx instead of SearchBar.tsx
import { type HadithResult } from "./HadithResults";

interface PresetButtonsProps {
  showPresetButtons: boolean;
  query: string;
  results: HadithResult[] | null; // Use the specific type instead of any
  onPresetClick: (topic: string) => void;
}

export function PresetButtons({
  showPresetButtons,
  query,
  results,
  onPresetClick,
}: PresetButtonsProps) {
  const presetTopics = ["Marriage", "Money", "Hardship", "Sickness", "Charity", "Prayer"];

  return (
    <>
      {showPresetButtons && !query && !results && (
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {presetTopics.map((topic) => (
            <Button key={topic} variant="default" onClick={() => onPresetClick(topic)} className="cursor-pointer">
              {topic}
            </Button>
          ))}
        </div>
      )}
    </>
  );
}