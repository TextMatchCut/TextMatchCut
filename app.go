package main

import (
	"TextMatchCut/core"
	"TextMatchCut/lib/gemini"
	"TextMatchCut/lib/openai"
	"TextMatchCut/types"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"image/png"
	"log"
	"math/rand"
	"os"
	"os/exec"
	"path/filepath"
	go_runtime "runtime"
	"strconv"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
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

func (a *App) GetDefaultAssetsPath() types.GetDefaultAssetsPathResponse {
	return types.GetDefaultAssetsPathResponse{
		Success: true,
		Path:    filepath.Join(os.TempDir(), "textmatchcut"),
	}
}

func (a *App) Run(config types.Config) types.RunResponse {
	dev := false

	if dev {
		outputPath, err := generateFrames(config, getDummySnippets(config), *a)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error: %v\n", err)
			return types.RunResponse{Success: false, Error: err.Error()}
			// os.Exit(1)
		}

		return types.RunResponse{Success: true, VideoData: outputPath}
	}
	// Initialize random seed
	rand.Seed(time.Now().UnixNano())

	//get env for GEMINI_API_KEY
	var aiSnippets []types.TextSnippet
	if config.Provider == "gemini" {
		apiKey := config.ApiKey
		if apiKey == "" {
			return types.RunResponse{
				Success: false,
				Error:   "API key is required for Gemini provider",
			}
		}
		snippets, err := gemini.GetSnippets(context.Background(), config.ApiKey, config)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error getting snippets from Gemini: %v\n", err)
			return types.RunResponse{Success: false, Error: err.Error()}
		}
		aiSnippets = snippets
	} else if config.Provider == "openai" {
		apiKey := config.ApiKey
		if apiKey == "" {
			return types.RunResponse{
				Success: false,
				Error:   "API key is required for OpenAI provider",
			}
		}
		snippets, err := openai.GetSnippets(context.Background(), apiKey, config)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error getting snippets from OpenAI: %v\n", err)
			return types.RunResponse{Success: false, Error: err.Error()}
		}
		aiSnippets = snippets
	} else {
		fmt.Fprintf(os.Stderr, "Error: Unsupported provider '%s'. Supported providers are 'gemini' and 'openai'.\n", config.Provider)
		return types.RunResponse{
			Success: false,
			Error:   fmt.Sprintf("Unsupported provider '%s'. Supported providers are 'gemini' and 'openai'.", config.Provider),
		}
	}

	// Check if FFmpeg is available
	_, err := exec.LookPath("ffmpeg")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: FFmpeg not found in PATH. Please install FFmpeg.\n")
		os.Exit(1)
	}

	// Auto-calculate font size if not specified explicitly
	if config.FontSize == 50 { // Default value
		config.FontSize = int(float64(config.Height) * 0.05)
	}

	videoData, err := generateFrames(config, aiSnippets, *a)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		return types.RunResponse{Success: false, Error: err.Error()}
	}

	// Success
	return types.RunResponse{Success: true, VideoData: videoData}
}

func (a *App) RenderPreview(config types.Config) types.RenderPreviewResponse {
	finalImage, err := core.GenerateFrame(1, config, getDummySnippets(config),
		// TODO: need to work on this
		float64(config.FontSize*len(config.HighlightedText)),
	)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error generating preview: %v\n", err)
		return types.RenderPreviewResponse{Success: false, Error: err.Error()}
	}

	var buffer bytes.Buffer
	err = png.Encode(&buffer, finalImage)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading preview file: %v\n", err)
		return types.RenderPreviewResponse{Success: false, Error: err.Error()}
	}

	fData := buffer.Bytes()
	frameData := base64.StdEncoding.EncodeToString(fData)
	return types.RenderPreviewResponse{Success: true, FrameData: frameData}
}

func (a *App) PickAudioFile() types.PickAudioFileResponse {
	file, err := runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:           "Select an audio file",
		ShowHiddenFiles: true,
		Filters: []runtime.FileFilter{
			{Pattern: "*.wav", DisplayName: "WAV Files"},
			{Pattern: "*.mp3", DisplayName: "MP3 Files"},
			{Pattern: "*.ogg", DisplayName: "OGG Files"},
			{Pattern: "*.flac", DisplayName: "FLAC Files"},
			{Pattern: "*.aac", DisplayName: "AAC Files"},
			{Pattern: "*.m4a", DisplayName: "M4A Files"},
		},
	})
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error opening file dialog: %v\n", err)
		runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
			Title:   "Error",
			Message: err.Error(),
			Buttons: []string{"OK"},
		})
		return types.PickAudioFileResponse{
			Success:   false,
			Error:     err.Error(),
			AudioData: "",
		}
	}

	if file == "" {
		fmt.Println("No file selected")
		return types.PickAudioFileResponse{
			Success:   false,
			Error:     "No file selected",
			AudioData: "",
		}
	}

	fmt.Printf("Selected file: %s\n", file)
	f, err := os.ReadFile(file)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading file: %v\n", err)
		runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
			Title:   "Error",
			Message: err.Error(),
			Buttons: []string{"OK"},
		})
		return types.PickAudioFileResponse{
			Success:   false,
			Error:     err.Error(),
			AudioData: "",
		}
	}

	base64String := base64.StdEncoding.EncodeToString(f)
	return types.PickAudioFileResponse{
		Success:   true,
		AudioData: base64String,
		Error:     "",
		Path:      file, // Return the path to the audio file
	}

}

func (a *App) Toast(toastConfig types.ToastConfig) {

	switch toastConfig.Type {
	case "info":
		runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
			Title:         toastConfig.Title,
			Message:       toastConfig.Message,
			Buttons:       []string{"OK"},
			DefaultButton: "OK",
		})
	case "warning":
		runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
			Title:         toastConfig.Title,
			Message:       toastConfig.Message,
			Buttons:       []string{"OK"},
			DefaultButton: "OK",
		})
	case "error":
		runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
			Title:         toastConfig.Title,
			Message:       toastConfig.Message,
			Buttons:       []string{"OK"},
			DefaultButton: "OK",
		})
	default:
		runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
			Title:         toastConfig.Title,
			Message:       toastConfig.Message,
			Buttons:       []string{"OK"},
			DefaultButton: "OK",
		})
	}

	// selection, err := runtime.MessageDialog(a.ctx, runtime.MessageDialogOptions{
	// 	Title:         toastConfig.Title,
	// 	Message:       toastConfig.Message,
	// 	Buttons:       []string{"one", "two", "three", "four"},
	// 	DefaultButton: "two",
	// 	CancelButton:  "three",
	// })
	// if err != nil {
	// 	fmt.Fprintf(os.Stderr, "Error showing message dialog: %v\n", err)
	// 	return
	// }
	// if selection == "" {
	// 	fmt.Println("No selection made")
	// 	return
	// }
}

// Generate unique filename
func generateUniqueFilename(prefix, extension string) string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return fmt.Sprintf("%s_%s.%s", prefix, hex.EncodeToString(bytes), extension)
}

// Generate video frames and return base64 data
func generateFrames(config types.Config, aiSnippets []types.TextSnippet, a App) (string, error) {
	if config.Verbose {
		fmt.Printf("Generating video: %dx%d @ %dfps for %ds\n", config.Width, config.Height, config.FPS, config.Duration)
		fmt.Printf("Highlighted text: '%s'\n", config.HighlightedText)
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
	err := os.MkdirAll(tempDir, 0755)
	if err != nil {
		return "", fmt.Errorf("failed to create temp directory: %v", err)
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

	tempDir = filepath.Join(os.TempDir(), "textmatchcut_frames_"+generateUniqueFilename("", ""))
	err = os.MkdirAll(tempDir, 0755)
	if err != nil {
		return "", fmt.Errorf("failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Generate frames
	for frameNum := 0; frameNum < totalFrames; frameNum++ {
		// Select random snippet and font
		finalImage, err := core.GenerateFrame(frameNum, config, aiSnippets, highlightRadius)

		os.Create(filepath.Join(tempDir, fmt.Sprintf("frame_%05d.png", frameNum)))

		if err != nil {
			return "", fmt.Errorf("failed to generate frame %d: %v", frameNum, err)
		}
		// Save frame
		framePath := filepath.Join(tempDir, fmt.Sprintf("frame_%05d.png", frameNum))
		file, err := os.Create(framePath)
		if err != nil {
			return "", fmt.Errorf("failed to create frame file: %v", err)
		}

		var buffer bytes.Buffer
		err = png.Encode(&buffer, finalImage)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error reading preview file: %v\n", err)
			return "", fmt.Errorf("failed to encode frame %d: %v", frameNum, err)
		}

		fData := buffer.Bytes()
		_, err = file.Write(fData)
		if err != nil {
			return "", fmt.Errorf("failed to write frame %d: %v", frameNum, err)
		}
		file.Close()
		frameData := base64.StdEncoding.EncodeToString(fData)
		// _ = base64.StdEncoding.EncodeToString(fData)
		runtime.EventsEmit(a.ctx, "frame", types.FrameRenderedPayload{
			FrameNum:    frameNum + 1,
			TotalFrames: totalFrames,
			FrameData:   frameData,
		})
		//wait
		time.Sleep(10 * time.Millisecond) // Simulate processing time
		// runtime.EventsEmit(a.ctx, "frame", nil)

		// Progress update
		if config.Verbose && (frameNum+1)%(totalFrames/10) == 0 {
			fmt.Printf("Progress: %d/%d frames\n", frameNum+1, totalFrames)
		}
	}

	if config.Verbose {
		fmt.Printf("All frames generated. Creating video...\n")
	}

	// Create video using FFmpeg
	outputPath := filepath.Join(os.TempDir(), generateUniqueFilename("text_match_cut_", "mp4"))
	// outputPath := config.OutputPath
	// if outputPath == "" {
	// 	outputPath = generateUniqueFilename("text_match_cut", "mp4")
	// }

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
				// "-i", config.SoundEffectPath, // Audio input
				"-i", "shutter.wav", // Audio input
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
		return "", fmt.Errorf("ffmpeg failed: %v", err)
	}

	fmt.Printf("Video created successfully: %s\n", outputPath)

	// --- NEW LOGIC ---
	// 1. Read the generated file into a byte slice
	fileBytes, err := os.ReadFile(outputPath)
	if err != nil {
		return "", fmt.Errorf("failed to read generated video file: %v", err)
	}

	// 2. Encode the byte slice to a Base64 string
	base64String := base64.StdEncoding.EncodeToString(fileBytes)

	// 3. Return the base64 string instead of the path
	return base64String, nil
}

func getDummySnippets(config types.Config) []types.TextSnippet {
	data, err := os.ReadFile("dummy.json")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading dummy.json: %v\n", err)
		os.Exit(1)
	}
	if config.Verbose {
		fmt.Printf("Parsed configuration: %+v\n", config)
	}
	fmt.Printf("Dummy data looks like this: %s\n", string(data))
	var snippets []types.AITextSnippets
	json.Unmarshal(data, &snippets)

	//convert AI snippets to TextSnippet format
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

	return aiSnippets
}

func ShowFileOnExplorer(filePath string) {
	if filePath == "" {
		fmt.Println("No file path provided")
		return
	}

	// Use the appropriate command based on the OS
	var cmd *exec.Cmd
	switch go_runtime.GOOS {
	case "windows":
		cmd = exec.Command("explorer", "/select,", filePath)
	case "darwin":
		cmd = exec.Command("open", "-R", filePath)
	default: // Linux and others
		cmd = exec.Command("xdg-open", filePath)
	}

	err := cmd.Run()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error opening file explorer: %v\n", err)
	}
}

func (a *App) OpenURL(url string) {
	runtime.BrowserOpenURL(a.ctx, url)
}
