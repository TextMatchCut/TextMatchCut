package gemini

import (
	"TextMatchCut/types"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
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

func GetSnippets(ctx context.Context, apiKey string, config types.Config) ([]types.TextSnippet, error) {
	client, err := getGeminiClient(ctx)
	if err != nil {
		return nil, err
	}

	geminiConfig := getGeminiConfig()

	// Check if FFmpeg is available
	_, err = exec.LookPath("ffmpeg")
	if err != nil {
		return nil, fmt.Errorf("FFmpeg not found in PATH")
	}

	// Auto-calculate font size if not specified explicitly
	if config.FontSize == 50 { // Default value
		config.FontSize = int(float64(config.Height) * 0.05)
	}

	prompt := fmt.Sprintf("Respond with 5 different text snippets with the highlighted text '%s'. Each snippet should have between %d and %d lines. Make sure that the highlighted text is not always at the start but random", config.HighlightedText, config.MinLines, config.MaxLines)
	log.Printf("Prompt for AI: %s\n", prompt)
	result, err := client.Models.GenerateContent(
		ctx,
		"gemini-2.5-flash",
		genai.Text(prompt),
		geminiConfig,
	)
	if err != nil {
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

	return aiSnippets, nil
}
