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

// auto type generation fails to parse this struct correctly
// maybe used in the future
// type AIConfig struct {
// 	Enabled  bool   `json:"enabled"`
// 	ApiKey   string `json:"apiKey"`
// 	Model    string `json:"model"`
// 	Provider string `json:"provider"`
// }

type Config struct {
	Width           int     `json:"Width"`
	Height          int     `json:"Height"`
	FPS             int     `json:"FPS"`
	Duration        int     `json:"Duration"`
	HighlightedText string  `json:"HighlightedText"`
	HighlightColor  string  `json:"HighlightColor"`
	TextColor       string  `json:"TextColor"`
	BackgroundColor string  `json:"BackgroundColor"`
	BackgroundImage string  `json:"BackgroundImage"`
	BlurType        string  `json:"BlurType"`
	BlurRadius      float64 `json:"BlurRadius"`
	BlurAngle       float64 `json:"BlurAngle"`
	FontSize        int     `json:"FontSize"`
	MinLines        int     `json:"MinLines"`
	MaxLines        int     `json:"MaxLines"`
	VerticalSpread  float64 `json:"VerticalSpread"`
	Font            string  `json:"Font"`
	AIEnabled       bool    `json:"AIEnabled"`
	ApiKey          string  `json:"ApiKey,omitempty"`
	Model           string  `json:"Model,omitempty"`
	Provider        string  `json:"Provider,omitempty"`
	Verbose         bool    `json:"Verbose,omitempty"`
	SoundEffectPath string  `json:"SoundEffectPath,omitempty"`
	Feather         float64 `json:"Feather"`
	Sfx             string  `json:"Sfx"`
	BackgroundImpl  string  `json:"BackgroundImpl"`
	HighlightRadius float64 `json:"HighlightRadius"`
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
	Path      string `json:"path,omitempty"`
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

type FrameRenderedPayload struct {
	FrameNum    int    `json:"frameNum"`
	TotalFrames int    `json:"totalFrames"`
	FrameData   string `json:"frameData"`
}

type GetDefaultAssetsPathResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
	Path    string `json:"path,omitempty"`
}
