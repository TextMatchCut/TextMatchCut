package types

type EfficientVariableBlurOptions struct {
	CenterX   int     // Center X coordinate
	CenterY   int     // Center Y coordinate
	Radius    float64 // Maximum effect radius
	MaxBlur   float64 // Maximum blur intensity
	Feather   float64 // Feather amount (0-1)
	BlurSteps int     // Number of blur levels to create
}

type WasmInput struct {
	FrameNum        int           `json:"frameNum"`
	Config          Config        `json:"config"`
	AiSnippets      []TextSnippet `json:"aiSnippets"`
	FontFiles       []string      `json:"fontFiles"`
	HighlightRadius float64       `json:"highlightRadius"`
	HighlightedText string        `json:"highlightedText"`
	HighlightColor  []float64     `json:"highlightColor"`
	TextColor       []float64     `json:"textColor"`
	BackgroundColor []float64     `json:"backgroundColor"`
	BlurType        string        `json:"blurType"`
	BlurRadius      float64       `json:"blurRadius"`
	BlurAngle       float64       `json:"blurAngle"`
	FontSize        int           `json:"fontSize"`
	MinLines        int           `json:"minLines"`
	MaxLines        int           `json:"maxLines"`
	VerticalSpread  float64       `json:"verticalSpread"`
}

type Config struct {
	Width           int
	Height          int
	FPS             int
	Duration        int
	HighlightedText string
	HighlightColor  [4]uint8 // Changed from string to [4]uint8
	TextColor       [4]uint8 // Changed from string to [4]uint8
	BackgroundColor [4]uint8 // Changed from string to [4]uint8
	BlurType        string
	BlurRadius      float64
	BlurAngle       float64 // New: for directional blur
	FontSize        int
	MinLines        int
	MaxLines        int
	VerticalSpread  float64
	OutputPath      string
	FontDir         string
	AIEnabled       bool
	Verbose         bool
	SoundEffectPath string
	Feather         float64 // Add this field since you're sending it
	Sfx             string
}

type TextSnippet struct {
	Lines          []string
	HighlightIndex int
}

type AITextSnippets struct {
	Text string `json:"text"`
}

type EfficientVariableDirectionalBlurOptions struct {
	CenterX   int     // Center X coordinate
	CenterY   int     // Center Y coordinate
	Radius    float64 // Maximum effect radius
	MaxLength float64 // Maximum blur length
	Angle     float64 // Angle for directional blur
	Feather   float64 // Feather amount (0-1)
	BlurSteps int     // Number of blur levels to create
}

type ToastConfig struct {
	Message string `json:"message"`
	Type    string `json:"type"`
	Title   string `json:"title"`
}

// Define a struct for a structured JSON response
type RunResponse struct {
	Success   bool   `json:"success"`
	Error     string `json:"error,omitempty"`
	VideoData string `json:"videoData,omitempty"`
}

type PickAudioFileResponse struct {
	Success   bool   `json:"success"`
	Error     string `json:"error,omitempty"`
	AudioData string `json:"audioData,omitempty"`
	Path      string `json:"path,omitempty"`
}

type RenderPreviewResponse struct {
	Success   bool   `json:"success"`
	Error     string `json:"error,omitempty"`
	FrameData string `json:"frameData,omitempty"`
}
