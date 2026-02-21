
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const shortcuts = [
  {
    category: "Script Elements",
    items: [
      { keys: ["Ctrl", "Shift", "H"], description: "Insert Scene Heading" },
      { keys: ["Ctrl", "Shift", "A"], description: "Insert Action" },
      { keys: ["Ctrl", "Shift", "C"], description: "Insert Character" },
      { keys: ["Ctrl", "Shift", "D"], description: "Insert Dialogue" },
      { keys: ["Ctrl", "Shift", "P"], description: "Insert Parenthetical" },
      { keys: ["Ctrl", "Shift", "T"], description: "Insert Transition" },
    ]
  },
  {
    category: "Editing",
    items: [
      { keys: ["Ctrl", "Z"], description: "Undo" },
      { keys: ["Ctrl", "Shift", "Z"], description: "Redo" },
      { keys: ["Ctrl", "S"], description: "Save Script" },
      { keys: ["Enter"], description: "Save current element" },
      { keys: ["Escape"], description: "Cancel editing" },
    ]
  },
  {
    category: "Navigation",
    items: [
      { keys: ["Tab"], description: "Quick element insertion" },
      { keys: ["Ctrl", "/"], description: "Show this help" },
    ]
  }
];

export const KeyboardShortcutsHelp = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Use these shortcuts to write scripts faster and more efficiently.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {shortcuts.map((category) => (
            <div key={category.category}>
              <h3 className="font-semibold text-lg mb-3 text-naija-green">
                {category.category}
              </h3>
              <div className="space-y-2">
                {category.items.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <Badge key={keyIndex} variant="outline" className="font-mono text-xs">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Pro Tip:</strong> Use <Badge variant="outline" className="mx-1 font-mono">Ctrl+/</Badge> 
            anytime to quickly view these shortcuts while writing.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
