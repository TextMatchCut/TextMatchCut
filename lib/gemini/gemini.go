package gemini

import (
	"TextMatchCut/types"
	"TextMatchCut/util"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
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

	log.Printf("Prompt for AI: %s\n", config.Prompt)
	result, err := client.Models.GenerateContent(
		ctx,
		config.Model,
		genai.Text(config.Prompt),
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

	aiSnippets := util.ParseSnippetsJSON(snippets, config.HighlightedText)

	fmt.Printf("Snippets look like this: %+v\n", aiSnippets)

	return aiSnippets, nil
}
