"use client";

import { useContext, useState, useEffect } from "react";
import { SupabaseContext } from "@/app/providers";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { createAvatar } from '@dicebear/core';
import { pixelArt } from '@dicebear/collection';
import { History } from 'lucide-react';
import { useHistoryPane } from "@/context/HistoryPaneContext"; // Import context hook

// Simple Google 'G' logo placeholder - replace with actual SVG if available
const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
    <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17182 0 7.54773 0 9C0 10.4523 0.347727 11.8282 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
    <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34545C13.4632 0.891818 11.43 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
  </svg>
);


export default function AuthButton() {
  const { session, supabase } = useContext(SupabaseContext);
  const { openHistoryPane } = useHistoryPane(); // Get function from context

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }, // Ensure redirect back
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // Extract user info safely
  const user = session?.user;
  const fullName = user?.user_metadata?.full_name;
  const firstName = fullName?.split(' ')[0] || 'User'; // Use 'User' if name is unavailable
  const initials = firstName?.charAt(0).toUpperCase() || 'U';

  // State to hold the avatar URL
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // Effect to generate avatar URL asynchronously
  useEffect(() => {
    if (!firstName) {
      setAvatarUrl(''); // Clear if no name
      return;
    }

    let isMounted = true; // Flag to prevent state update on unmounted component

    const generateAvatar = async () => {
      const avatar = createAvatar(pixelArt, {
        seed: firstName,
      });
      const dataUri = await avatar.toDataUri(); // Use async method
      if (isMounted) {
        setAvatarUrl(dataUri);
      }
    };

    generateAvatar();

    return () => {
      isMounted = false; // Cleanup function to set flag
    };
  }, [firstName]); // Re-run when firstName changes


  if (session) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl} alt={firstName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {firstName}
              </p>
              {user?.email && (
                 <p className="text-xs leading-none text-muted-foreground">
                   {user.email}
                 </p>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={openHistoryPane}>
            <History className="mr-2 h-4 w-4" />
            <span>Search History</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={handleSignIn} variant="outline">
      <GoogleLogo />
      <span className="ml-2">Sign in with Google</span>
    </Button>
  );
}
