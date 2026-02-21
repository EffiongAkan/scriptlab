
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
import { Genre, SubGenre } from "@/types";

interface GenreSelectorProps {
  value: Genre | undefined;
  onValueChange: (value: Genre) => void;
  className?: string;
}

export function GenreSelector({ value, onValueChange, className }: GenreSelectorProps) {
  const [open, setOpen] = React.useState(false);

  // Create genre options array
  const genreOptions = React.useMemo(() => {
    return Object.entries(Genre).map(([key, value]) => ({
      value: value,
      label: value,
    }));
  }, []);

  // Find the current genre label
  const currentGenreLabel = React.useMemo(() => {
    if (!value) {
      return undefined;
    }
    
    const option = genreOptions.find(option => option.value === value);
    return option ? option.label : undefined;
  }, [value, genreOptions]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {currentGenreLabel || "Select genre..."}
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4 shrink-0 opacity-50"><path d="m6 9 6 6 6-6"/></svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search genres..." />
          <CommandList>
            <CommandEmpty>No genre found.</CommandEmpty>
            <CommandGroup>
              {genreOptions.length > 0 ? (
                genreOptions.map((genre) => (
                  <CommandItem
                    key={genre.value}
                    value={genre.label}
                    onSelect={() => {
                      onValueChange(genre.value as Genre);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === genre.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {genre.label}
                  </CommandItem>
                ))
              ) : (
                <CommandItem disabled>No genres available</CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface SubGenreSelectorProps {
  values: SubGenre[];
  onValuesChange: (values: SubGenre[]) => void;
  className?: string;
}

export function SubGenreSelector({ values, onValuesChange, className }: SubGenreSelectorProps) {
  const [open, setOpen] = React.useState(false);
  // Ensure values is always an array
  const safeValues = React.useMemo(() => Array.isArray(values) ? values : [], [values]);

  // Create subgenre options array
  const subGenreOptions = React.useMemo(() => {
    return Object.entries(SubGenre).map(([key, value]) => ({
      value: value,
      label: value,
    }));
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {safeValues.length > 0
            ? `${safeValues.length} subgenres selected`
            : "Select subgenres..."}
          <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 h-4 w-4 shrink-0 opacity-50"><path d="m6 9 6 6 6-6"/></svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search subgenres..." />
          <CommandList>
            <CommandEmpty>No subgenre found.</CommandEmpty>
            <CommandGroup>
              {subGenreOptions.length > 0 ? (
                subGenreOptions.map((subGenre) => (
                  <CommandItem
                    key={subGenre.value}
                    value={subGenre.label}
                    onSelect={() => {
                      onValuesChange(
                        safeValues.includes(subGenre.value as SubGenre)
                          ? safeValues.filter((v) => v !== subGenre.value)
                          : [...safeValues, subGenre.value as SubGenre]
                      );
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        safeValues.includes(subGenre.value as SubGenre)
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50"
                      )}
                    >
                      {safeValues.includes(subGenre.value as SubGenre) && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                    {subGenre.label}
                  </CommandItem>
                ))
              ) : (
                <CommandItem disabled>No subgenres available</CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
