"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HadithCardProps {
  hadith: {
    id: number;
    text_ar: string;
    text_en: string;
    reference_number?: string; // Make optional
    source: string;
    chapter?: string | null; // Allow null
    chapter_no?: number | null; // Allow null
    narrator?: string;
    grade?: string;
  };
}

// The translations separate the chain of narrators from the hadith text with a long run of spaces
const SECTION_BREAK = /\s{4,}/;
const NARRATED_BY = /^(Narrated) (.+?):$/;
const HIGHLIGHT =
  /\b(?:(Messenger of Allah|Allah's|Allah|Prophet|Messenger|Apostle)|(prayers?|salah|zakat|fasting|hajj|Quran|Sunnah))\b/g;

function highlightTerms(text: string) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(HIGHLIGHT)) {
    parts.push(text.slice(last, match.index));
    parts.push(
      <span
        key={match.index}
        className={match[1] ? "text-emerald-600 font-semibold" : "text-violet-600"}
      >
        {match[0]}
      </span>
    );
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return parts;
}

function HadithText({ text }: { text: string }) {
  const sections = text.trim().split(SECTION_BREAK);
  const [intro, body] = sections.length > 1 ? [sections[0], sections.slice(1)] : [null, sections];
  const narratedBy = intro?.match(NARRATED_BY);

  return (
    <div className="mb-4 space-y-4">
      {intro && (
        <p className="text-muted-foreground">
          {narratedBy ? (
            <>
              {narratedBy[1]}{" "}
              <span className="text-blue-600 font-semibold">{narratedBy[2]}</span>:
            </>
          ) : (
            intro
          )}
        </p>
      )}
      {body.map((paragraph, i) => (
        <p key={i}>{highlightTerms(paragraph)}</p>
      ))}
    </div>
  );
}

export function HadithCard({ hadith }: HadithCardProps) {
  return (
    <Card className="mb-6 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold">
              {hadith.source}
            </CardTitle>
            <CardDescription>
              {hadith.chapter && `Chapter: ${hadith.chapter_no} ${hadith.chapter}`}
              {hadith.reference_number && (
                <span className="ml-2">Reference: {hadith.reference_number}</span>
              )}
              {hadith.narrator && (
                <div className="mt-1">Narrated by: <span className="text-blue-600">{hadith.narrator}</span></div>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-gray-500" />
            {hadith.grade && (
              <Badge variant="outline" className="ml-2">
                Grade: {hadith.grade}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Tabs defaultValue="english" className="w-full">
          <TabsList className="grid mx-auto w-1/3 grid-cols-2">
            <TabsTrigger value="english">English</TabsTrigger>
            <TabsTrigger value="arabic">Arabic</TabsTrigger>
          </TabsList>
          
          <TabsContent value="arabic" className="mt-4">
            {/* Arabic Text (RTL) */}
            <div 
              dir="rtl" 
              lang="ar" 
              className="text-2xl leading-loose font-arabic py-3 p-2"
            >
              {hadith.text_ar}
            </div>
          </TabsContent>
          
          <TabsContent value="english" className="mt-4">
            {/* English Translation (LTR) */}
            <div dir="ltr" className="text-lg leading-relaxed p-2">
              <HadithText text={hadith.text_en} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}