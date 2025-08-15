package openai

import (
	"TextMatchCut/types"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"

	openai "github.com/sashabaranov/go-openai"
)

var (
	openaiClientInstance *openai.Client
	clientOnce           sync.Once
)

func getOpenAIClient(apiKey string) *openai.Client {
	clientOnce.Do(func() {
		openaiClientInstance = openai.NewClient(apiKey)
	})
	return openaiClientInstance
}

func GetSnippets(ctx context.Context, apiKey string, config types.Config) ([]types.TextSnippet, error) {
	client := getOpenAIClient(apiKey)

	prompt := fmt.Sprintf("Respond with 5 different text snippets with the highlighted text '%s'. Each snippet should have between %d and %d lines. Make sure that the highlighted text is not always at the start but random. Respond in JSON array format: [{\"text\": \"...\"}, ...]", config.HighlightedText, config.MinLines, config.MaxLines)
	log.Printf("Prompt for AI: %s\n", prompt)

	req := openai.ChatCompletionRequest{
		Model: openai.GPT3Dot5Turbo,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
	}

	resp, err := client.CreateChatCompletion(ctx, req)
	if err != nil {
		return nil, err
	}
	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no choices returned from OpenAI")
	}

	var snippets []types.AITextSnippets
	if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &snippets); err != nil {
		return nil, err
	}

	// Convert AI snippets to TextSnippet format
	aiSnippets := make([]types.TextSnippet, len(snippets))
	for i, snippet := range snippets {
		lines := strings.Split(snippet.Text, ".")
		highlightIndex := -1
		for j, line := range lines {
			if strings.Contains(line, config.HighlightedText) {
				highlightIndex = j
				break
			}
		}
		aiSnippets[i] = types.TextSnippet{
			Lines:          lines,
			HighlightIndex: highlightIndex,
		}
	}

	return aiSnippets, nil
}
