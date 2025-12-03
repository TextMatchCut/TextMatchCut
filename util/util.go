package util

import (
	types "TextMatchCut/types"
	"strings"
)

func ParseSnippetsJSON(snippets []types.AITextSnippets, highlightedText string) []types.TextSnippet {
	aiSnippets := make([]types.TextSnippet, len(snippets))
	for i, snippet := range snippets {
		lines := strings.Split(snippet.Text, ".")
		highlightIndex := -1
		for j, line := range lines {
			if strings.Contains(line, highlightedText) {
				highlightIndex = j
				break
			}
		}
		aiSnippets[i] = types.TextSnippet{
			Lines:          lines,
			HighlightIndex: highlightIndex,
		}
	}
	return aiSnippets
}
