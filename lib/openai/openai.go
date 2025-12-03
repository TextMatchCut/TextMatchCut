package openai

import (
	"TextMatchCut/types"
	"TextMatchCut/util"
	"context"
	"encoding/json"
	"fmt"
	"log"
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

	prompt := config.Prompt + "(Respond in JSON array format: [{\"text\": \"...\"}, ...] )"
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

	aiSnippets := util.ParseSnippetsJSON(snippets, config.HighlightedText)

	fmt.Printf("Snippets look like this: %+v\n", aiSnippets)

	return aiSnippets, nil
}
