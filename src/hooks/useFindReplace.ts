import { useState, useCallback, useMemo } from 'react';
import { ScriptElementType } from '@/hooks/useScriptContent';

export interface FindReplaceOptions {
    caseSensitive: boolean;
    wholeWord: boolean;
}

export interface MatchLocation {
    elementId: string;
    elementIndex: number;
    startPos: number;
    endPos: number;
    matchText: string;
}

export function useFindReplace(elements: ScriptElementType[]) {
    const [searchTerm, setSearchTerm] = useState('');
    const [replaceTerm, setReplaceTerm] = useState('');
    const [caseSensitive, setCaseSensitive] = useState(false);
    const [wholeWord, setWholeWord] = useState(false);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

    // Find all matches in the script elements
    const matches = useMemo((): MatchLocation[] => {
        if (!searchTerm) return [];

        const results: MatchLocation[] = [];
        const searchPattern = wholeWord
            ? new RegExp(`\\b${escapeRegExp(searchTerm)}\\b`, caseSensitive ? 'g' : 'gi')
            : new RegExp(escapeRegExp(searchTerm), caseSensitive ? 'g' : 'gi');

        elements.forEach((element, index) => {
            const content = element.content;
            let match;

            while ((match = searchPattern.exec(content)) !== null) {
                results.push({
                    elementId: element.id,
                    elementIndex: index,
                    startPos: match.index,
                    endPos: match.index + match[0].length,
                    matchText: match[0]
                });
            }
        });

        return results;
    }, [elements, searchTerm, caseSensitive, wholeWord]);

    // Navigate to next match
    const findNext = useCallback(() => {
        if (matches.length === 0) return null;
        const nextIndex = (currentMatchIndex + 1) % matches.length;
        setCurrentMatchIndex(nextIndex);
        return matches[nextIndex];
    }, [matches, currentMatchIndex]);

    // Navigate to previous match
    const findPrevious = useCallback(() => {
        if (matches.length === 0) return null;
        const prevIndex = currentMatchIndex <= 0 ? matches.length - 1 : currentMatchIndex - 1;
        setCurrentMatchIndex(prevIndex);
        return matches[prevIndex];
    }, [matches, currentMatchIndex]);

    // Replace current match
    const replaceCurrent = useCallback((onReplace: (elementId: string, newContent: string) => void) => {
        if (currentMatchIndex < 0 || currentMatchIndex >= matches.length) return false;

        const match = matches[currentMatchIndex];
        const element = elements.find(el => el.id === match.elementId);

        if (!element) return false;

        const newContent =
            element.content.substring(0, match.startPos) +
            replaceTerm +
            element.content.substring(match.endPos);

        onReplace(match.elementId, newContent);

        // Navigation after replace:
        // We stay at the same index because the match at this index is now gone, 
        // and the previous "next" match now slides into this index.
        // If we were at the last match, we reset.
        if (matches.length <= 1) {
            setCurrentMatchIndex(-1);
        } else if (currentMatchIndex >= matches.length - 1) {
            setCurrentMatchIndex(0);
        }

        return true;
    }, [matches, currentMatchIndex, replaceTerm, elements]);

    // Replace all matches
    const replaceAll = useCallback((onReplace: (elementId: string, newContent: string) => void) => {
        if (matches.length === 0) return 0;

        // Group matches by element to process each element only once
        const matchesByElement = new Map<string, MatchLocation[]>();
        matches.forEach(match => {
            const elementMatches = matchesByElement.get(match.elementId) || [];
            elementMatches.push(match);
            matchesByElement.set(match.elementId, elementMatches);
        });

        let totalReplacements = 0;

        // Replace in each element (from end to start to maintain positions)
        matchesByElement.forEach((elementMatches, elementId) => {
            const element = elements.find(el => el.id === elementId);
            if (!element) return;

            let newContent = element.content;

            // Sort matches by position (descending) to replace from end to start
            const sortedMatches = [...elementMatches].sort((a, b) => b.startPos - a.startPos);

            sortedMatches.forEach(match => {
                newContent =
                    newContent.substring(0, match.startPos) +
                    replaceTerm +
                    newContent.substring(match.endPos);
                totalReplacements++;
            });

            onReplace(elementId, newContent);
        });

        // Search will naturally refresh due to useMemo dependency on 'elements'
        setSearchTerm(''); // Clear search after replace all
        setCurrentMatchIndex(-1);
        return totalReplacements;
    }, [matches, replaceTerm, elements]);

    // Reset search when term changes
    const handleSearchChange = useCallback((term: string) => {
        setSearchTerm(term);
        setCurrentMatchIndex(-1);
    }, []);

    return {
        searchTerm,
        replaceTerm,
        caseSensitive,
        wholeWord,
        currentMatchIndex,
        totalMatches: matches.length,
        matches,
        setSearchTerm: handleSearchChange,
        setReplaceTerm,
        setCaseSensitive,
        setWholeWord,
        findNext,
        findPrevious,
        replaceCurrent,
        replaceAll,
    };
}

// Helper function to escape regex special characters
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
