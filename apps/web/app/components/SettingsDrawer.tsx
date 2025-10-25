"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, Globe, Settings } from "lucide-react";
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
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@freestyle/ui";
import { useRouter } from "next/navigation";

export default function SettingsDrawer() {
  const [theme, setTheme] = useState("light");
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
  const handleThemeChange = (value: string) => {
    setTheme(value);
    // Apply theme to document
    if (value === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

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
              Customize your theme and language preferences
            </DrawerDescription>
          </DrawerHeader>

          <div className="p-4 pb-0 space-y-6">
            {/* Theme Switcher */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Theme</Label>
              <RadioGroup value={theme} onValueChange={handleThemeChange}>
                <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="light" id="light" />
                  <Label
                    htmlFor="light"
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label
                    htmlFor="dark"
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="system" id="system" />
                  <Label
                    htmlFor="system"
                    className="flex items-center gap-2 cursor-pointer flex-1"
                  >
                    <Settings className="h-4 w-4" />
                    System
                  </Label>
                </div>
              </RadioGroup>
            </div>

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
