"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

export function HadithCard({ hadith }: HadithCardProps) {
  const [isTranslating, setIsTranslating] = useState(false);

  // Function to highlight narrators and proper nouns in the English text
  const formatEnglishText = (text: string) => {
    if (!text) return "";
    
       
    // Highlight common narrator patterns and add line break after "said" followed by punctuation
    let formattedText = text.replace(
      /(narrated|reported by|It is narrated on the authority of) ([A-Z][a-z]+ (?:[a-z]+ )?[A-Z][a-z]+|[A-Z][a-z]+)( that | reports: )/g,
      '<span class="text-gray-600 font-medium">$1</span> <span class="text-blue-600 font-semibold">$2</span>$3'
    );

      // Special handling for "said" with punctuation - add line break
      formattedText = formattedText.replace(
        /(said|says)([:,;]) /g,
        '$1$2<br /><br />'
      );
    
    // Highlight Allah, Prophet, Messenger, etc.
    formattedText = formattedText.replace(
      /(Allah|Prophet|Messenger of Allah|Muhammad|God|Allah's|Messenger|Abu Huraira)([\s.,;:)])/g, 
      '<span class="text-emerald-600 font-semibold">$1</span>$2'
    );
    
    // Highlight common Islamic terms
    formattedText = formattedText.replace(
      /(prayer|salah|zakat|fasting|hajj|jihad|Quran|Islam|Muslim|Sunnah|Hadith)([\s.,;:)])/gi,
      '<span class="text-violet-600">$1</span>$2'
    );
    
    return formattedText;
  };

  const handleChatGPTTranslate = () => {
    setIsTranslating(true);
    // Simulate API call delay
    setTimeout(() => setIsTranslating(false), 2000);
    // In real implementation, you'd make an API call to OpenAI here
  };

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
          <TabsList className="grid mx-auto w-full sm:w-1/3 grid-cols-2">
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
            <Button 
                onClick={handleChatGPTTranslate} 
                disabled={isTranslating}
                variant="outline"
              >
                {isTranslating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Translating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.5-2.6067-1.4997z" />
                    </svg>
                    Translate with ChatGPT
                  </>
                )}
              </Button>
          </TabsContent>
          
          <TabsContent value="english" className="mt-4">
            {/* English Translation (LTR) */}
            <div dir="ltr" className="text-lg leading-relaxed p-2">
              <div 
                dangerouslySetInnerHTML={{ __html: formatEnglishText(hadith.text_en) }} 
                className="mb-4"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}