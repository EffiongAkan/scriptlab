
import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Language } from "@/types";

interface LanguageSelectorProps {
  value: Language | undefined;
  onValueChange: (value: Language) => void;
  className?: string;
}

export function LanguageSelector({ value, onValueChange, className }: LanguageSelectorProps) {
  const [open, setOpen] = React.useState(false);

  // Create language options array
  const languageOptions = React.useMemo(() => {
    return Object.entries(Language).map(([key, value]) => ({
      value: value,
      label: value,
    }));
  }, []);

  // Find the current language label
  const currentLanguageLabel = React.useMemo(() => {
    if (!value) {
      return undefined;
    }
    
    const option = languageOptions.find(option => option.value === value);
    return option ? option.label : undefined;
  }, [value, languageOptions]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {currentLanguageLabel || "Select language..."}
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4 shrink-0 opacity-50"><path d="m6 9 6 6 6-6"/></svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search languages..." />
          <CommandList>
            <CommandEmpty>No language found.</CommandEmpty>
            <CommandGroup>
              {languageOptions.length > 0 ? (
                languageOptions.map((language) => (
                  <CommandItem
                    key={language.value}
                    value={language.label}
                    onSelect={() => {
                      onValueChange(language.value as Language);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === language.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {language.label}
                  </CommandItem>
                ))
              ) : (
                <CommandItem disabled>No languages available</CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
