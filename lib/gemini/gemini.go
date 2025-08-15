package gemini

import (
	"TextMatchCut/types"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"sync"

	"google.golang.org/genai"
)

var (
	geminiConfigInstance *genai.GenerateContentConfig
	geminiClientInstance *genai.Client
	configOnce           sync.Once
	clientOnce           sync.Once
)

func getGeminiConfig() *genai.GenerateContentConfig {
	configOnce.Do(func() {
		geminiConfigInstance = &genai.GenerateContentConfig{
			ResponseMIMEType: "application/json",
			ResponseSchema: &genai.Schema{
				Type: genai.TypeArray,
				Items: &genai.Schema{
					Type: genai.TypeObject,
					Properties: map[string]*genai.Schema{
						"text": {Type: genai.TypeString},
					},
				},
			},
		}
	})
	return geminiConfigInstance
}

func getGeminiClient(ctx context.Context) (*genai.Client, error) {
	var err error
	clientOnce.Do(func() {
		geminiClientInstance, err = genai.NewClient(ctx, nil)
	})
	return geminiClientInstance, err
}

func GetSnippets(ctx context.Context, config types.Config) ([]types.TextSnippet, error) {
	os.Setenv("GEMINI_API_KEY", config.ApiKey)
	client, err := getGeminiClient(ctx)
	if err != nil {
		return nil, err
	}
	geminiConfig := getGeminiConfig()

	prompt := fmt.Sprintf("Respond with 5 different text snippets with the highlighted text '%s'. Each snippet should have between %d and %d lines. Make sure that the highlighted text is not always at the start but random", config.HighlightedText, config.MinLines, config.MaxLines)
	log.Printf("Prompt for AI: %s\n", prompt)
	result, err := client.Models.GenerateContent(
		ctx,
		config.Model,
		genai.Text(prompt),
		geminiConfig,
	)
	if err != nil {
		log.Printf("Error generating content: %v\n", err)
		return nil, err
	}

	var snippets []types.AITextSnippets
	if err := json.Unmarshal([]byte(result.Text()), &snippets); err != nil {
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

	fmt.Printf("Snippets look like this: %+v\n", aiSnippets)

	return aiSnippets, nil
}
