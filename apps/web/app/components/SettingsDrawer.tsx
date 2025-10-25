"use client";

import { useEffect, useState } from "react";
import { Globe, Settings } from "lucide-react";
import { Button } from "@freestyle/ui";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@freestyle/ui";
import { useRouter } from "next/navigation";

export default function SettingsDrawer() {
  const [language, setLanguage] = useState("en");
  const router = useRouter();

  useEffect(() => {
    const cookie = typeof document !== "undefined" ? document.cookie : "";
    const match = cookie
      .split("; ")
      .find((row) => row.startsWith("locale="))
      ?.split("=")[1];
    if (match === "en" || match === "es") {
      setLanguage(match);
    }
  }, []);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    // Persist the chosen locale for the server layout
    document.cookie = `locale=${value}; path=/; max-age=31536000`;
    // Refresh to re-render server components with new locale
    router.refresh();
  };

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>
              Customize your language preferences
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-0 space-y-6">
            {/* Language Switcher */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Language</Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-full">
                  <Globe className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
