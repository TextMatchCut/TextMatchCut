//go:build js && wasm

package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image/png"

	"syscall/js"

	"TextMatchCut/core"
	"TextMatchCut/types"
)

func GenerateFrameAsBase64(frameNum int, config types.Config, aiSnippets []types.TextSnippet, fontFiles []string, highlightRadius float64) (string, error) {
	img, err := core.GenerateFrame(frameNum, config, aiSnippets, fontFiles, highlightRadius)
	if err != nil {
		return "", err // Propagate the error
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return "", fmt.Errorf("failed to encode frame to PNG: %v", err)
	}

	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}

func GenerateFrameFromJSON(inputJSON string) (string, error) {
	var input types.WasmInput
	if err := json.Unmarshal([]byte(inputJSON), &input); err != nil {
		return "", fmt.Errorf("failed to unmarshal JSON input: %v", err)
	}

	return GenerateFrameAsBase64(
		input.FrameNum,
		input.Config,
		input.AiSnippets,
		input.FontFiles,
		input.HighlightRadius,
	)
}

// Update your ApplyGaussianBlur function to use this

func main() {
	fmt.Println("Go WebAssembly module loaded!")
	js.Global().Set("GenerateFrameFromJSON", js.FuncOf(func(this js.Value, p []js.Value) interface{} {
		if len(p) != 1 {
			return js.ValueOf("Invalid argument count")
		}
		inputJSON := p[0].String()
		result, err := GenerateFrameFromJSON(inputJSON)
		if err != nil {
			return js.ValueOf("Error: " + err.Error())
		}
		return js.ValueOf(result)
	}))
	// Keep the Go runtime alive
	// select { // Block forever
	// case <-make(chan struct{}):
	// 	runtime.Gosched() // Yield to allow other goroutines to run
	// }
	select {}
}

// Helper functions
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
