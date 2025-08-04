package main

import (
	"TextMatchCut/lib"
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"image/png"
	"log"
	"math/rand"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"google.golang.org/genai"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

func (a *App) Run() {
	dev := false
	// go run main.go -text="Web Dev" -width=1920 -height=1080 -duration=2 -fps=4 -font-size=80 -min-lines=5 -max-lines=12 -output="epic.mp4" -blur-type=gaussian -blur-radius=1.5  -sfx shutter.wav -blur-type=directional -blur-radius=40
	config := lib.Config{
		Width:           1920,
		Height:          1080,
		FPS:             4,
		Duration:        2,
		HighlightedText: "Web Dev",
		HighlightColor:  "yellow",
		TextColor:       "black",
		BackgroundColor: "white",
		BlurType:        "gaussian",
		// BlurRadius:      1.5,
		BlurRadius:      40,
		FontSize:        80,
		MinLines:        5,
		MaxLines:        12,
		OutputPath:      "epic.mp4",
		AIEnabled:       true,
		Verbose:         false,
		FontDir:         "",
		SoundEffectPath: "shutter.wav",
		VerticalSpread:  1.5,
	}

	if dev {
		data, err := os.ReadFile("dummy.json")
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error reading dummy.json: %v\n", err)
			os.Exit(1)
		}
		if config.Verbose {
			fmt.Printf("Parsed configuration: %+v\n", config)
		}
		fmt.Printf("Dummy data looks like this: %s\n", string(data))
		var snippets []lib.AITextSnippets
		json.Unmarshal(data, &snippets)

		//convert AI snippets to TextSnippet format
		aiSnippets := make([]lib.TextSnippet, len(snippets))
		for i, snippet := range snippets {
			lines := strings.Split(snippet.Text, ".")
			highlightIndex := -1
			for j, line := range lines {
				if strings.Contains(line, config.HighlightedText) {
					highlightIndex = j
					break
				}
			}
			aiSnippets[i] = lib.TextSnippet{
				Lines:          lines,
				HighlightIndex: highlightIndex,
			}
		}

		// Generate video
		err = generateFrames(config, aiSnippets)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			os.Exit(1)
		}
		return
	}
	apiKey := os.Getenv("GEMINI_API_KEY")
	fmt.Println("GEMINI_API_KEY:", apiKey)
	if apiKey == "" {
		log.Fatal("GEMINI_API_KEY environment variable is not set")
	}
	// Initialize random seed
	rand.Seed(time.Now().UnixNano())

	// Parse command line arguments
	ctx := context.Background()
	client, err := genai.NewClient(ctx, nil)
	if err != nil {
		log.Fatal(err)
	}
	//get env for GEMINI_API_KEY

	geminiConfig := &genai.GenerateContentConfig{
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

	// Check if FFmpeg is available
	_, err = exec.LookPath("ffmpeg")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: FFmpeg not found in PATH. Please install FFmpeg.\n")
		os.Exit(1)
	}

	// Auto-calculate font size if not specified explicitly
	if config.FontSize == 50 { // Default value
		config.FontSize = int(float64(config.Height) * 0.05)
	}

	prompt := fmt.Sprintf("Respond with 5 different text snippets with the highlighted text '%s'. Each snippet should have between %d and %d lines.  Make sure that the highlighted text is not always at the start but random", config.HighlightedText, config.MinLines, config.MaxLines)
	log.Printf("Prompt for AI: %s\n", prompt)
	result, err := client.Models.GenerateContent(
		ctx,
		"gemini-2.5-flash",
		genai.Text(prompt),
		geminiConfig,
	)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println(result.Text())
	var snippets []lib.AITextSnippets
	json.Unmarshal([]byte(result.Text()), &snippets)
	//convert AI snippets to TextSnippet format
	aiSnippets := make([]lib.TextSnippet, len(snippets))
	for i, snippet := range snippets {
		lines := strings.Split(snippet.Text, ".")
		highlightIndex := -1
		for j, line := range lines {
			if strings.Contains(line, config.HighlightedText) {
				highlightIndex = j
				break
			}
		}
		aiSnippets[i] = lib.TextSnippet{
			Lines:          lines,
			HighlightIndex: highlightIndex,
		}
	}

	// Generate video
	err = generateFrames(config, aiSnippets)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

// Generate unique filename
func generateUniqueFilename(prefix, extension string) string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return fmt.Sprintf("%s_%s.%s", prefix, hex.EncodeToString(bytes), extension)
}

// Generate video frames
func generateFrames(config lib.Config, aiSnippets []lib.TextSnippet) error {
	if config.Verbose {
		fmt.Printf("Generating video: %dx%d @ %dfps for %ds\n", config.Width, config.Height, config.FPS, config.Duration)
		fmt.Printf("Highlighted text: '%s'\n", config.HighlightedText)
	}

	// Find fonts
	fontFiles, err := findFontFiles(config.FontDir)
	if err != nil {
		return fmt.Errorf("failed to find fonts: %v", err)
	}

	if config.Verbose {
		fmt.Printf("Found %d font(s)\n", len(fontFiles))
	}

	// // Generate text snippets
	// snippets := make([]TextSnippet, 0, 5)
	// for i := 0; i < 5; i++ {
	// 	snippet := generateRandomTextSnippet(config.HighlightedText, config.MinLines, config.MaxLines)
	// 	snippets = append(snippets, snippet)
	// }

	// if config.Verbose {
	// 	fmt.Printf("Generated %d text snippets\n", len(snippets))
	// }

	// Calculate total frames
	totalFrames := config.FPS * config.Duration

	// Create temporary directory for frames
	tempDir := filepath.Join(os.TempDir(), "textmatchcut_frames_"+generateUniqueFilename("", ""))
	err = os.MkdirAll(tempDir, 0755)
	if err != nil {
		return fmt.Errorf("failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	if config.Verbose {
		fmt.Printf("Generating %d frames...\n", totalFrames)
	}

	//no need to recalculate highlight width every frame in the loop
	highlightRadius := float64(config.FontSize * len(config.HighlightedText))
	if config.Verbose {
		fmt.Printf("Highlight radius: %.2f\n", highlightRadius)
	}

	// Generate frames
	for frameNum := 0; frameNum < totalFrames; frameNum++ {
		// Select random snippet and font
		finalImage, err := lib.GenerateFrame(frameNum, config, aiSnippets, fontFiles, highlightRadius, tempDir, totalFrames)
		if err != nil {
			return fmt.Errorf("failed to generate frame %d: %v", frameNum, err)
		}
		// Save frame
		framePath := filepath.Join(tempDir, fmt.Sprintf("frame_%05d.png", frameNum))
		file, err := os.Create(framePath)
		if err != nil {
			return fmt.Errorf("failed to create frame file: %v", err)
		}

		err = png.Encode(file, finalImage)
		file.Close()
		if err != nil {
			return fmt.Errorf("failed to encode frame: %v", err)
		}

		// Progress update
		if config.Verbose && (frameNum+1)%(totalFrames/10) == 0 {
			fmt.Printf("Progress: %d/%d frames\n", frameNum+1, totalFrames)
		}
	}

	if config.Verbose {
		fmt.Printf("All frames generated. Creating video...\n")
	}

	// Create video using FFmpeg
	outputPath := config.OutputPath
	if outputPath == "" {
		outputPath = generateUniqueFilename("text_match_cut", "mp4")
	}

	var cmd *exec.Cmd
	if config.SoundEffectPath != "" {
		if _, err := os.Stat(config.SoundEffectPath); os.IsNotExist(err) {
			log.Printf("Warning: sound effect file not found at '%s', proceeding without sound.", config.SoundEffectPath)
		} else {
			// Build the complex filter graph for repeating the sound effect
			var filterComplexParts []string
			var amixInputs string

			for i := 0; i < totalFrames; i++ {
				delayMs := (i * 1000) / config.FPS
				outputStream := fmt.Sprintf("a%d", i)
				// [1:a] refers to the audio stream from the second input file (the sound effect)
				filterComplexParts = append(filterComplexParts, fmt.Sprintf("[1:a]adelay=%d|%d[%s]", delayMs, delayMs, outputStream))
				amixInputs += fmt.Sprintf("[%s]", outputStream)
			}

			amixFilter := fmt.Sprintf("%samix=inputs=%d[a]", amixInputs, totalFrames)
			filterComplexParts = append(filterComplexParts, amixFilter)
			filterComplex := strings.Join(filterComplexParts, ";")
			cmd = exec.Command("ffmpeg",
				"-y", // Overwrite output file
				"-framerate", strconv.Itoa(config.FPS),
				"-i", filepath.Join(tempDir, "frame_%05d.png"), // Video input
				"-i", config.SoundEffectPath, // Audio input
				"-filter_complex", filterComplex,
				"-map", "0:v", // Map video from first input
				"-map", "[a]", // Map audio from filtergraph
				"-c:v", "libx264",
				"-preset", "medium",
				"-pix_fmt", "yuv420p",
				"-r", strconv.Itoa(config.FPS),
				"-shortest", // End encoding when the shortest stream (video) ends
				outputPath,
			)
		}
	}

	if cmd == nil {
		// Original FFmpeg command or fallback
		cmd = exec.Command("ffmpeg",
			"-y", // Overwrite output file
			"-framerate", strconv.Itoa(config.FPS),
			"-i", filepath.Join(tempDir, "frame_%05d.png"),
			"-c:v", "libx264",
			"-preset", "medium",
			"-pix_fmt", "yuv420p",
			"-r", strconv.Itoa(config.FPS),
			outputPath,
		)
	}

	if config.Verbose {
		fmt.Printf("Running FFmpeg command: %s\n", strings.Join(cmd.Args, " "))
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
	}

	err = cmd.Run()
	if err != nil {
		return fmt.Errorf("ffmpeg failed: %v", err)
	}

	fmt.Printf("Video created successfully: %s\n", outputPath)
	return nil
}

// Find font files in directory
func findFontFiles(fontDir string) ([]string, error) {
	var fontFiles []string

	if fontDir == "" {
		// Use embedded font as fallback
		return []string{"embedded"}, nil
	}

	err := filepath.Walk(fontDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		ext := strings.ToLower(filepath.Ext(path))
		if ext == ".ttf" || ext == ".otf" {
			fontFiles = append(fontFiles, path)
		}
		return nil
	})

	if err != nil {
		return nil, err
	}

	if len(fontFiles) == 0 {
		return []string{"embedded"}, nil
	}

	return fontFiles, nil
}
