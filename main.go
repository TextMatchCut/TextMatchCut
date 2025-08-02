package main

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"log"
	"math"
	"math/rand"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/anthonynsimon/bild/blur"
	"github.com/fogleman/gg"
	"github.com/golang/freetype/truetype"
	"golang.org/x/image/font/gofont/goregular"
	"google.golang.org/genai"
)

// Configuration structure
type Config struct {
	Width           int
	Height          int
	FPS             int
	Duration        int
	HighlightedText string
	HighlightColor  string
	TextColor       string
	BackgroundColor string
	BlurType        string
	BlurRadius      float64
	FontSize        int
	MinLines        int
	MaxLines        int
	VerticalSpread  float64
	OutputPath      string
	FontDir         string
	AIEnabled       bool
	Verbose         bool
	SoundEffectPath string
}

// Text snippet structure
type TextSnippet struct {
	Lines          []string
	HighlightIndex int
}

// Color parsing helper
func parseColor(colorStr string) (color.RGBA, error) {
	// Handle hex colors
	if strings.HasPrefix(colorStr, "#") {
		colorStr = colorStr[1:]
	}

	// Handle named colors
	switch strings.ToLower(colorStr) {
	case "white":
		return color.RGBA{255, 255, 255, 255}, nil
	case "black":
		return color.RGBA{0, 0, 0, 255}, nil
	case "red":
		return color.RGBA{255, 0, 0, 255}, nil
	case "green":
		return color.RGBA{0, 255, 0, 255}, nil
	case "blue":
		return color.RGBA{0, 0, 255, 255}, nil
	case "yellow":
		return color.RGBA{255, 255, 0, 255}, nil
	case "cyan":
		return color.RGBA{0, 255, 255, 255}, nil
	case "magenta":
		return color.RGBA{255, 0, 255, 255}, nil
	}

	// Parse hex color
	if len(colorStr) == 6 {
		r, err := strconv.ParseUint(colorStr[0:2], 16, 8)
		if err != nil {
			return color.RGBA{}, err
		}
		g, err := strconv.ParseUint(colorStr[2:4], 16, 8)
		if err != nil {
			return color.RGBA{}, err
		}
		b, err := strconv.ParseUint(colorStr[4:6], 16, 8)
		if err != nil {
			return color.RGBA{}, err
		}
		return color.RGBA{uint8(r), uint8(g), uint8(b), 255}, nil
	}

	return color.RGBA{}, fmt.Errorf("invalid color format: %s", colorStr)
}

// Generate random words for fallback text
func generateRandomWords(numWords int) string {
	words := []string{
		"the", "quick", "brown", "fox", "jumps", "over", "lazy", "dog",
		"lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing",
		"elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore",
		"et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam",
		"quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi",
		"aliquip", "ex", "ea", "commodo", "consequat", "duis", "aute", "irure",
		"in", "reprehenderit", "voluptate", "velit", "esse", "cillum", "fugiat",
		"nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat",
		"non", "proident", "sunt", "culpa", "qui", "officia", "deserunt",
		"mollit", "anim", "id", "est", "laborum", "dragon", "fire", "kingdom",
		"throne", "sword", "magic", "castle", "quest", "warrior", "battle",
		"legend", "ancient", "power", "mysterious", "enchanted", "royal",
	}

	result := make([]string, numWords)
	for i := 0; i < numWords; i++ {
		result[i] = words[rand.Intn(len(words))]
	}
	return strings.Join(result, " ")
}

// Generate random text snippet with highlighted text
func generateRandomTextSnippet(highlightedText string, minLines, maxLines int) TextSnippet {
	numLines := rand.Intn(maxLines-minLines+1) + minLines
	highlightLineIndex := rand.Intn(numLines)

	lines := make([]string, numLines)
	minWordsAround := 2
	maxWordsAround := 6

	for i := 0; i < numLines; i++ {
		if i == highlightLineIndex {
			wordsBefore := generateRandomWords(rand.Intn(maxWordsAround-minWordsAround+1) + minWordsAround)
			wordsAfter := generateRandomWords(rand.Intn(maxWordsAround-minWordsAround+1) + minWordsAround)
			lines[i] = fmt.Sprintf("%s %s %s", wordsBefore, highlightedText, wordsAfter)
		} else {
			lines[i] = generateRandomWords(rand.Intn(maxWordsAround*2-maxWordsAround) + maxWordsAround)
		}
	}

	return TextSnippet{
		Lines:          lines,
		HighlightIndex: highlightLineIndex,
	}
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

// Load font from file or use embedded font
func loadFont(fontPath string, size float64) (*truetype.Font, error) {
	if fontPath == "embedded" {
		f, err := truetype.Parse(goregular.TTF)
		if err != nil {
			return nil, err
		}
		return f, nil
	}

	fontBytes, err := os.ReadFile(fontPath)
	if err != nil {
		return nil, err
	}

	f, err := truetype.Parse(fontBytes)
	if err != nil {
		return nil, err
	}

	return f, nil
}

// Generate unique filename
func generateUniqueFilename(prefix, extension string) string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return fmt.Sprintf("%s_%s.%s", prefix, hex.EncodeToString(bytes), extension)
}

// Create text image frame
func createTextImageFrame(config Config, snippet TextSnippet, fontPath string, highlightCenterX, highlightCenterY float64) (image.Image, error) {
	// Create context
	dc := gg.NewContext(config.Width, config.Height)
	// try to center the text
	dc.Translate(
		float64(config.Width/2-int(highlightCenterX)),
		float64(config.Height/2-int(highlightCenterY)),
	)
	// Parse colors
	bgColor, err := parseColor(config.BackgroundColor)
	if err != nil {
		return nil, fmt.Errorf("invalid background color: %v", err)
	}

	textColor, err := parseColor(config.TextColor)
	if err != nil {
		return nil, fmt.Errorf("invalid text color: %v", err)
	}

	highlightColor, err := parseColor(config.HighlightColor)
	if err != nil {
		return nil, fmt.Errorf("invalid highlight color: %v", err)
	}

	// Set background
	dc.SetRGBA255(int(bgColor.R), int(bgColor.G), int(bgColor.B), int(bgColor.A))
	dc.Clear()

	// Load font
	ttfFont, err := loadFont(fontPath, float64(config.FontSize))
	if err != nil {
		return nil, fmt.Errorf("failed to load font: %v", err)
	}

	face := truetype.NewFace(ttfFont, &truetype.Options{
		Size: float64(config.FontSize),
		DPI:  72,
	})
	dc.SetFontFace(face)

	// Calculate line height
	lineHeight := float64(config.FontSize) * config.VerticalSpread

	// Calculate total text block height
	totalHeight := lineHeight * float64(len(snippet.Lines))
	startY := (float64(config.Height) - totalHeight) / 2

	// Draw text lines
	dc.SetRGBA255(int(textColor.R), int(textColor.G), int(textColor.B), int(textColor.A))

	for i, line := range snippet.Lines {
		y := startY + float64(i)*lineHeight

		if i == snippet.HighlightIndex {
			// Find the highlighted text position in the line
			highlightStart := strings.Index(line, config.HighlightedText)
			if highlightStart != -1 {
				// Measure text parts
				prefix := line[:highlightStart]
				suffix := line[highlightStart+len(config.HighlightedText):]

				prefixWidth, _ := dc.MeasureString(prefix)
				highlightWidth, _ := dc.MeasureString(config.HighlightedText)
				lineWidth, _ := dc.MeasureString(line)

				// Center the entire line
				lineX := (float64(config.Width) - lineWidth) / 2

				// Calculate highlight position
				highlightX := lineX + prefixWidth

				// Draw highlight rectangle
				padding := float64(config.FontSize) * 0.1
				dc.SetRGBA255(int(highlightColor.R), int(highlightColor.G), int(highlightColor.B), int(highlightColor.A))
				dc.DrawRectangle(highlightX-padding, y-padding, highlightWidth+2*padding, lineHeight+2*padding)
				dc.Fill()

				// Draw text parts
				dc.SetRGBA255(int(textColor.R), int(textColor.G), int(textColor.B), int(textColor.A))

				// Draw prefix
				if prefix != "" {
					dc.DrawString(prefix, lineX, y+lineHeight*0.8)
				}

				// Draw highlighted text (potentially bold)
				dc.DrawString(config.HighlightedText, highlightX, y+lineHeight*0.8)

				// Draw suffix
				if suffix != "" {
					dc.DrawString(suffix, highlightX+highlightWidth, y+lineHeight*0.8)
				}
			} else {
				// Fallback: center the line normally
				lineWidth, _ := dc.MeasureString(line)
				x := (float64(config.Width) - lineWidth) / 2
				dc.DrawString(line, x, y+lineHeight*0.8)
			}
		} else {
			// Center the line normally
			lineWidth, _ := dc.MeasureString(line)
			x := (float64(config.Width) - lineWidth) / 2
			dc.DrawString(line, x, y+lineHeight*0.8)
		}
	}

	return dc.Image(), nil
}

type EfficientVariableBlurOptions struct {
	CenterX   int     // Center X coordinate
	CenterY   int     // Center Y coordinate
	Radius    float64 // Maximum effect radius
	MaxBlur   float64 // Maximum blur intensity
	Feather   float64 // Feather amount (0-1)
	BlurSteps int     // Number of blur levels to create
}

// ApplyEfficientVariableBlur creates multiple blur levels and interpolates between them
func ApplyEfficientVariableBlur(src image.Image, options EfficientVariableBlurOptions) *image.RGBA {
	bounds := src.Bounds()

	// Create multiple blur levels
	blurLevels := make([]image.Image, options.BlurSteps+1)
	blurLevels[0] = src // Original (no blur)

	for i := 1; i <= options.BlurSteps; i++ {
		sigma := options.MaxBlur * float64(i) / float64(options.BlurSteps)
		blurLevels[i] = blur.Gaussian(src, sigma)
	}

	result := image.NewRGBA(bounds)
	centerX := float64(options.CenterX)
	centerY := float64(options.CenterY)
	maxRadius := options.Radius
	featherAmount := options.Feather

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			// Calculate distance and blur intensity
			dx := float64(x) - centerX
			dy := float64(y) - centerY
			distance := math.Sqrt(dx*dx + dy*dy)

			var blurIntensity float64
			if distance <= maxRadius*(1-featherAmount) {
				blurIntensity = 0.0
			} else if distance <= maxRadius {
				featherStart := maxRadius * (1 - featherAmount)
				featherRange := maxRadius - featherStart
				blurIntensity = (distance - featherStart) / featherRange
				blurIntensity = (1 - math.Cos(blurIntensity*math.Pi)) / 2
			} else {
				blurIntensity = 1.0
			}

			// Map blur intensity to blur levels
			levelFloat := blurIntensity * float64(options.BlurSteps)
			level := int(levelFloat)
			fraction := levelFloat - float64(level)

			if level >= options.BlurSteps {
				// Use maximum blur
				result.Set(x, y, blurLevels[options.BlurSteps].At(x, y))
			} else if fraction == 0 {
				// Use exact level
				result.Set(x, y, blurLevels[level].At(x, y))
			} else {
				// Interpolate between two levels
				c1 := blurLevels[level].At(x, y)
				c2 := blurLevels[level+1].At(x, y)

				r1, g1, b1, a1 := c1.RGBA()
				r2, g2, b2, a2 := c2.RGBA()

				r := uint8((float64(r1>>8)*(1-fraction) + float64(r2>>8)*fraction))
				g := uint8((float64(g1>>8)*(1-fraction) + float64(g2>>8)*fraction))
				b := uint8((float64(b1>>8)*(1-fraction) + float64(b2>>8)*fraction))
				a := uint8((float64(a1>>8)*(1-fraction) + float64(a2>>8)*fraction))

				result.Set(x, y, color.RGBA{r, g, b, a})
			}
		}
	}

	return result
}

// Calculate the center position of highlighted text in a text snippet
func calculateHighlightPosition(config Config, snippet TextSnippet, fontPath string) (float64, float64, error) {
	// Load font for measurements
	ttfFont, err := loadFont(fontPath, float64(config.FontSize))
	if err != nil {
		return 0, 0, err
	}

	face := truetype.NewFace(ttfFont, &truetype.Options{
		Size: float64(config.FontSize),
		DPI:  72,
	})

	dc := gg.NewContext(config.Width, config.Height)
	dc.SetFontFace(face)

	lineHeight := float64(config.FontSize) * config.VerticalSpread
	totalHeight := lineHeight * float64(len(snippet.Lines))
	startY := (float64(config.Height) - totalHeight) / 2

	highlightLine := snippet.HighlightIndex
	if highlightLine < 0 || highlightLine >= len(snippet.Lines) {
		// Fallback to center of frame
		return float64(config.Width) / 2, float64(config.Height) / 2, nil
	}

	line := snippet.Lines[highlightLine]
	highlightStart := strings.Index(line, config.HighlightedText)

	if highlightStart == -1 {
		// Highlighted text not found, return center of the line
		lineY := startY + float64(highlightLine)*lineHeight + lineHeight/2
		return float64(config.Width) / 2, lineY, nil
	}

	// Calculate precise position
	prefix := line[:highlightStart]
	prefixWidth, _ := dc.MeasureString(prefix)
	highlightWidth, _ := dc.MeasureString(config.HighlightedText)
	lineWidth, _ := dc.MeasureString(line)

	// Line positioning
	lineX := (float64(config.Width) - lineWidth) / 2
	lineY := startY + float64(highlightLine)*lineHeight

	// Highlight positioning
	highlightX := lineX + prefixWidth
	highlightCenterX := highlightX + highlightWidth/2
	highlightCenterY := lineY + lineHeight/2

	return highlightCenterX, highlightCenterY, nil
}

// Generate video frames
func generateFrames(config Config, aiSnippets []TextSnippet) error {
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
		var snippet TextSnippet
		if frameNum < len(aiSnippets) {
			snippet = aiSnippets[frameNum]
		} else {
			snippet = aiSnippets[rand.Intn(len(aiSnippets))]
		}
		fontPath := fontFiles[rand.Intn(len(fontFiles))]

		// Calculate highlighted text position BEFORE generating the frame
		highlightCenterX, highlightCenterY, err := calculateHighlightPosition(config, snippet, fontPath)
		if err != nil {
			if config.Verbose {
				fmt.Printf("Warning: Failed to calculate highlight position for frame %d: %v\n", frameNum, err)
			}
			// Use fallback position
			highlightCenterX = float64(config.Width) / 2
			highlightCenterY = float64(config.Height) / 2
		}

		// Generate frame
		fmt.Printf("X and Y coordinates for highlight: %.2f, %.2f\n", highlightCenterX, highlightCenterY)
		img, err := createTextImageFrame(config, snippet, fontPath, highlightCenterX, highlightCenterY)
		if err != nil {
			if config.Verbose {
				fmt.Printf("Warning: Failed to generate frame %d: %v\n", frameNum, err)
			}
			// Try with embedded font as fallback
			img, err = createTextImageFrame(config, snippet, "embedded", highlightCenterX, highlightCenterY)
			if err != nil {
				return fmt.Errorf("failed to generate frame %d even with fallback font: %v", frameNum, err)
			}
			// Recalculate position with embedded font
			highlightCenterX, highlightCenterY, _ = calculateHighlightPosition(config, snippet, "embedded")
		}

		// Apply blur with calculated highlight position as focal point
		blurApplied := ApplyEfficientVariableBlur(img, EfficientVariableBlurOptions{
			CenterX:   config.Width / 2,
			CenterY:   config.Height / 2,
			Radius:    highlightRadius,
			MaxBlur:   5.0,
			Feather:   0.9,
			BlurSteps: 20,
		})

		// Save frame
		framePath := filepath.Join(tempDir, fmt.Sprintf("frame_%05d.png", frameNum))
		file, err := os.Create(framePath)
		if err != nil {
			return fmt.Errorf("failed to create frame file: %v", err)
		}

		err = png.Encode(file, blurApplied)
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

type AITextSnippets struct {
	Text string `json:"text"`
}

func parseConfig(config *Config) error {
	// Default values
	flag.IntVar(&config.Width, "width", 1024, "Video width in pixels")
	flag.IntVar(&config.Height, "height", 1024, "Video height in pixels")
	flag.IntVar(&config.FPS, "fps", 10, "Frames per second")
	flag.IntVar(&config.Duration, "duration", 5, "Video duration in seconds")
	flag.StringVar(&config.HighlightedText, "text", "Mother of Dragons", "Text to highlight")
	flag.StringVar(&config.HighlightColor, "highlight-color", "yellow", "Highlight background color")
	flag.StringVar(&config.TextColor, "text-color", "black", "Text color")
	flag.StringVar(&config.BackgroundColor, "bg-color", "white", "Background color")
	flag.StringVar(&config.BlurType, "blur-type", "gaussian", "Blur type (gaussian or radial)")
	flag.Float64Var(&config.BlurRadius, "blur-radius", 4.0, "Blur radius")
	flag.IntVar(&config.FontSize, "font-size", 50, "Font size in pixels")
	flag.IntVar(&config.MinLines, "min-lines", 7, "Minimum lines of text per frame")
	flag.IntVar(&config.MaxLines, "max-lines", 10, "Maximum lines of text per frame")
	flag.Float64Var(&config.VerticalSpread, "vertical-spread", 1.5, "Vertical spacing multiplier")
	flag.StringVar(&config.OutputPath, "output", "", "Output video file path")
	flag.StringVar(&config.FontDir, "font-dir", "", "Directory containing font files")
	flag.BoolVar(&config.AIEnabled, "ai", false, "Enable AI text generation (not implemented)")
	flag.BoolVar(&config.Verbose, "verbose", false, "Enable verbose output")
	flag.StringVar(&config.SoundEffectPath, "sfx", "", "Path to a sound effect file to play every second.")
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "Text Match Cut Video Generator\n\n")
		fmt.Fprintf(os.Stderr, "Usage: %s [options]\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "Options:\n")
		flag.PrintDefaults()
		fmt.Fprintf(os.Stderr, "\nExample:\n")
		fmt.Fprintf(os.Stderr, "  %s -text=\"Hello World\" -width=800 -height=600 -duration=10 -output=myvideo.mp4\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "\nRequirements:\n")
		fmt.Fprintf(os.Stderr, "  - FFmpeg must be installed and available in PATH\n")
		fmt.Fprintf(os.Stderr, "  - Optional: TTF/OTF font files in -font-dir\n")
	}

	flag.Parse()

	if config.HighlightedText == "" {
		fmt.Fprintf(os.Stderr, "Error: highlighted text cannot be empty\n")
		return fmt.Errorf("highlighted text cannot be empty")
	}

	if config.FPS < 1 || config.FPS > 60 {
		fmt.Fprintf(os.Stderr, "Error: FPS must be between 1 and 60\n")
		return fmt.Errorf("FPS must be between 1 and 60")
	}

	if config.Duration < 1 || config.Duration > 300 {
		fmt.Fprintf(os.Stderr, "Error: duration must be between 1 and 300 seconds\n")
		return fmt.Errorf("duration must be between 1 and 300 seconds")
	}

	if config.Width < 256 || config.Width > 4096 || config.Height < 256 || config.Height > 4096 {
		fmt.Fprintf(os.Stderr, "Error: width and height must be between 256 and 4096 pixels\n")
		return fmt.Errorf("width and height must be between 256 and 4096 pixels")
	}
	return nil
}

func main() {
	dev := flag.Bool("dev", false, "Uses dummy data for dev purposes, so you don't need to set GEMINI_API_KEY and wait for AI response")
	config := Config{}
	err := parseConfig(&config)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error parsing configuration: %v\n", err)
		os.Exit(1)
	}
	if *dev {
		data, err := os.ReadFile("dummy.json")
		if err != nil {
			fmt.Fprintf(os.Stderr, "Error reading dummy.json: %v\n", err)
			os.Exit(1)
		}
		if config.Verbose {
			fmt.Printf("Parsed configuration: %+v\n", config)
		}
		fmt.Printf("Dummy data looks like this: %s\n", string(data))
		var snippets []AITextSnippets
		json.Unmarshal(data, &snippets)

		//convert AI snippets to TextSnippet format
		aiSnippets := make([]TextSnippet, len(snippets))
		for i, snippet := range snippets {
			lines := strings.Split(snippet.Text, ".")
			highlightIndex := -1
			for j, line := range lines {
				if strings.Contains(line, config.HighlightedText) {
					highlightIndex = j
					break
				}
			}
			aiSnippets[i] = TextSnippet{
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
	var snippets []AITextSnippets
	json.Unmarshal([]byte(result.Text()), &snippets)
	//convert AI snippets to TextSnippet format
	aiSnippets := make([]TextSnippet, len(snippets))
	for i, snippet := range snippets {
		lines := strings.Split(snippet.Text, ".")
		highlightIndex := -1
		for j, line := range lines {
			if strings.Contains(line, config.HighlightedText) {
				highlightIndex = j
				break
			}
		}
		aiSnippets[i] = TextSnippet{
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
