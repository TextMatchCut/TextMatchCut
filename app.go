package main

import (
	"TextMatchCut/core"
	"TextMatchCut/types"
	"bytes"
	"context"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
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
	ctx        context.Context
	cancelFunc context.CancelFunc
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	a.checkAndEmitIfNoFfmpeg()
}

// CancelRun cancels the ongoing video generation process.
func (a *App) Cancel() {
	if a.cancelFunc != nil {
		fmt.Println("Cancellation requested by frontend.")
		a.cancelFunc()
		a.cancelFunc = nil
	}
}

func (a *App) GetDefaultAssetsPath() types.GetDefaultAssetsPathResponse {
	return types.GetDefaultAssetsPathResponse{
		Success: true,
		Path:    filepath.Join(os.TempDir(), "textmatchcut"),
	}
}

func (a *App) Run(config types.Config) types.RunResponse {

	_, err := exec.LookPath("ffmpeg")
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: FFmpeg not found in PATH. Please install FFmpeg.\n")
		return types.RunResponse{Success: false, Error: "FFmpeg not found in PATH. Please install FFmpeg."}
	}

	// Create cancellable context for this specific run
	ctx, cancel := context.WithCancel(a.ctx)
	a.cancelFunc = cancel
	defer func() {
		a.cancelFunc = nil // Cleanup when function exits
	}()

	aiSnippets, err := core.GetSnippets(ctx, config)
	if err != nil {
		if errors.Is(err, context.Canceled) {
			fmt.Println("Snippet generation was cancelled.")
			return types.RunResponse{Success: false, Error: "Operation cancelled by user."}
		}
		fmt.Fprintf(os.Stderr, "Error getting snippets: %v\n", err)
		return types.RunResponse{Success: false, Error: err.Error()}
	}

	videoData, fPath, err := generateFrames(ctx, config, aiSnippets, *a)

	// homeDir, err := os.UserHomeDir()
	// save to user download dir
	// if config.OutputPath == "" {
	// 	if err != nil {
	// 		return types.RunResponse{Success: false, Error: err.Error()}
	// 	}
	// 	config.OutputPath = filepath.Join(homeDir, "Downloads", "output.mp4")
	// }

	// config.OutputPath = filepath.Join(homeDir, ".textmatchcut", "output.mp4")

	if err != nil {
		if errors.Is(err, context.Canceled) {
			fmt.Println("Run operation was cancelled.")
			return types.RunResponse{Success: false, Error: "Operation cancelled by user."}
		}
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		return types.RunResponse{Success: false, Error: err.Error()}
	}

	// Success
	return types.RunResponse{Success: true, VideoData: videoData, Path: fPath}
}

func (a *App) RenderPreview(config types.Config) types.RenderPreviewResponse {
	ctx, cancel := context.WithCancel(a.ctx)
	a.cancelFunc = cancel // Make the cancel function available to a.Cancel()
	defer func() {
		a.cancelFunc = nil // Cleanup when function exits
	}()

	snippets := make([]types.TextSnippet, 0, config.SnippetSize)
	for i := 0; i < config.SnippetSize; i++ {
		snippet := core.GenerateRandomTextSnippet(config)
		snippets = append(snippets, snippet)
	}

	finalImage, err := core.GenerateFrame(1, config, snippets)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error generating preview: %v\n", err)
		return types.RenderPreviewResponse{Success: false, Error: err.Error()}
	}

	select {
	case <-ctx.Done():
		fmt.Println("Preview operation was cancelled.")
		return types.RenderPreviewResponse{Success: false, Error: "Operation cancelled by user."}
	default:
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
}

// Generate unique filename
func generateUniqueFilename(prefix, extension string) string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return fmt.Sprintf("%s_%s.%s", prefix, hex.EncodeToString(bytes), extension)
}

// Generate video frames and return base64 data
func generateFrames(ctx context.Context, config types.Config, aiSnippets []types.TextSnippet, a App) (string, string, error) {
	if config.Verbose {
		fmt.Printf("Generating video: %dx%d @ %dfps for %d snippets\n", config.Width, config.Height, config.FPS, len(aiSnippets))
		fmt.Printf("Highlighted text: '%s'\n", config.HighlightedText)
	}
	log.Printf("Generating video: %dx%d @ %dfps with %d snippets\n", config.Width, config.Height, config.FPS, len(aiSnippets))

	totalFrames := len(aiSnippets)

	if totalFrames == 0 {
		return "", "", fmt.Errorf("no snippets were generated, cannot create video")
	}

	// Create temporary directory for frames
	tempDir := filepath.Join(os.TempDir(), "textmatchcut_frames_"+generateUniqueFilename("", ""))
	err := os.MkdirAll(tempDir, 0755)
	if err != nil {
		return "", "", fmt.Errorf("failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	if config.Verbose {
		fmt.Printf("Generating %d frames...\n", totalFrames)
	}

	var highlightRadius float64
	if config.HighlightRadius != 0 {
		highlightRadius = config.HighlightRadius
	} else {
		highlightRadius = float64(config.FontSize * len(config.HighlightedText))
	}

	if config.Verbose {
		fmt.Printf("Highlight radius: %.2f\n", highlightRadius)
	}

	tempDir = filepath.Join(os.TempDir(), "textmatchcut_frames_"+generateUniqueFilename("", ""))
	err = os.MkdirAll(tempDir, 0755)
	if err != nil {
		return "", "", fmt.Errorf("failed to create temp directory: %v", err)
	}
	defer os.RemoveAll(tempDir)

	// Generate frames
	for frameNum := 0; frameNum < totalFrames; frameNum++ {
		// Check for cancellation signal
		select {
		case <-ctx.Done():
			return "", "", ctx.Err() // Return cancellation error
		default:
			// Continue execution
		}
		// Select random snippet and font
		finalImage, err := core.GenerateFrame(frameNum, config, aiSnippets)

		os.Create(filepath.Join(tempDir, fmt.Sprintf("frame_%05d.png", frameNum)))

		if err != nil {
			return "", "", fmt.Errorf("failed to generate frame %d: %v", frameNum, err)
		}
		// Save frame
		framePath := filepath.Join(tempDir, fmt.Sprintf("frame_%05d.png", frameNum))
		file, err := os.Create(framePath)
		if err != nil {
			return "", "", fmt.Errorf("failed to create frame file: %v", err)
		}

		var buffer bytes.Buffer
		err = png.Encode(&buffer, finalImage)
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error reading preview file: %v\n", err)
			return "", "", fmt.Errorf("failed to encode frame %d: %v", frameNum, err)
		}

		fData := buffer.Bytes()
		_, err = file.Write(fData)
		if err != nil {
			return "", "", fmt.Errorf("failed to write frame %d: %v", frameNum, err)
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

	hDir, err := os.UserHomeDir()
	if err != nil {
		hDir = os.TempDir()
	}

	fDir := filepath.Join(hDir, ".textmatchcut")

	outputPath := filepath.Join(fDir, generateUniqueFilename("text_match_cut_"+config.HighlightedText, "mp4"))

	os.MkdirAll(fDir, 0755)

	var cmd *exec.Cmd
	// if config.SoundEffectPath != "" {
	// if _, err := os.Stat(config.SoundEffectPath); os.IsNotExist(err) {
	// 	log.Printf("Warning: sound effect file not found at '%s', proceeding without sound.", config.SoundEffectPath)
	// } else {
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
	shutterPath := filepath.Join(os.TempDir(), "textmatchcut", "sfx", "shutter.wav")

	cmd = exec.CommandContext(ctx, "ffmpeg",
		"-y", // Overwrite output file
		"-framerate", strconv.Itoa(config.FPS),
		"-i", filepath.Join(tempDir, "frame_%05d.png"), // Video input
		"-i", shutterPath, // Audio input
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

	if config.Verbose {
		fmt.Printf("Running FFmpeg command: %s\n", strings.Join(cmd.Args, " "))
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
	}

	err = cmd.Run()
	if err != nil {
		return "", "", fmt.Errorf("ffmpeg failed: %v", err)
	}

	fmt.Printf("Video created successfully: %s\n", outputPath)

	// --- NEW LOGIC ---
	// 1. Read the generated file into a byte slice
	fileBytes, err := os.ReadFile(outputPath)
	if err != nil {
		return "", "", fmt.Errorf("failed to read generated video file: %v", err)
	}

	// 2. Encode the byte slice to a Base64 string
	base64String := base64.StdEncoding.EncodeToString(fileBytes)

	// 3. Return the base64 string instead of the path
	return base64String, fDir, nil
}

/* dont remove usefull in development */
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

func (a *App) ShowFileOnExplorer(filePath string) {
	if filePath == "" {
		fmt.Println("No file path provided")
		return
	}

	// Use the appropriate command based on the OS
	var cmd *exec.Cmd

	fmt.Printf("Opening path %s", filePath)
	switch go_runtime.GOOS {
	case "windows":
		cmd = exec.Command("explorer", filePath)
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

func (a *App) checkAndEmitIfNoFfmpeg() {
	_, err := exec.LookPath("ffmpeg")
	if err != nil {
		runtime.EventsEmit(a.ctx, "no-ffmpeg", nil)
		fmt.Println("FFmpeg not found in PATH")
	}
}
