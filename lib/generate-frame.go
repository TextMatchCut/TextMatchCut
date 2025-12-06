//go:build js && wasm

/*wasm entrypoint*/
package main

import (
	"TextMatchCut/core"
	"TextMatchCut/types"
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image/png"
	"syscall/js"
)

func GenerateFrameAsBase64(frameNum int, config types.Config, snippets []types.TextSnippet) (string, error) {
	img, err := core.GenerateFrame(frameNum, config, snippets)
	if err != nil {
		return "", err // Propagate the error
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return "", fmt.Errorf("failed to encode frame to PNG: %v", err)
	}

	return base64.StdEncoding.EncodeToString(buf.Bytes()), nil
}

func GO_GenerateRandomTextSnippetWeb(config types.Config) []types.TextSnippet {
	dummySnippets := make([]types.TextSnippet, 0)
	for i := 0; i < config.SnippetSize; i++ {
		generated_snippet := core.GenerateRandomTextSnippet(config)
		dummySnippets = append(dummySnippets, generated_snippet)
	}
	return dummySnippets
}

func GO_RenderFrameWeb(input types.GO_RenderFrameWeb, snippets []types.TextSnippet) (string, error) {
	if len(snippets) == 0 {
		// Generate dummy snippets for testing
		fmt.Println("No snippets provided, generating dummy snippets for testing.")
		dummySnippets := GO_GenerateRandomTextSnippetWeb(input.Config)
		return GenerateFrameAsBase64(
			input.FrameNum,
			input.Config,
			dummySnippets,
		)
	}

	return GenerateFrameAsBase64(
		input.FrameNum,
		input.Config,
		snippets,
	)
}

func main() {
	fmt.Println("Go WebAssembly module loaded!")
	js.Global().Set("GO_GenerateFrameFromJSON", js.FuncOf(func(this js.Value, p []js.Value) interface{} {
		if len(p) != 2 {
			return js.ValueOf("Invalid argument count")
		}
		inputJSON := p[0].String()
		var input types.GO_RenderFrameWeb
		if err := json.Unmarshal([]byte(inputJSON), &input); err != nil {
			return js.ValueOf("Error: failed to unmarshal JSON input: " + err.Error())
		}
		snippets := p[1].String()

		var snippetsArray []types.TextSnippet
		if snippets != "" && snippets != "\"\"" { // Also check for quoted empty string
			// Unmarshal the snippets JSON into a Go slice
			if err := json.Unmarshal([]byte(snippets), &snippetsArray); err != nil {
				return js.ValueOf("Error: failed to unmarshal snippets JSON: " + err.Error())
			}
		}

		fmt.Printf("Snippets input length: %d\n", len(snippetsArray))

		result, err := GO_RenderFrameWeb(input, snippetsArray)

		if err != nil {
			return js.ValueOf("Error: " + err.Error())
		}

		return js.ValueOf(result)
	}))

	js.Global().Set("GO_GenerateRandomTextSnippetWeb", js.FuncOf(func(this js.Value, p []js.Value) interface{} {
		if len(p) != 1 {
			return js.ValueOf("Invalid argument count")
		}
		configJSON := p[0].String()
		var config types.Config
		if err := json.Unmarshal([]byte(configJSON), &config); err != nil {
			return js.ValueOf("Error: failed to unmarshal JSON input: " + err.Error())
		}
		result := GO_GenerateRandomTextSnippetWeb(config)
		resultJSON, err := json.Marshal(result)
		if err != nil {
			return js.ValueOf("Error: failed to marshal snippets to JSON: " + err.Error())
		}
		return js.ValueOf(string(resultJSON))
	}))

	/*
		Uncomment the following block to expose GetSnippets to JavaScript
		current commented out because go wasm fetch requests don't resolve for some reason
	*/
	// js.Global().Set("GO_GetSnippets", js.FuncOf(func(this js.Value, p []js.Value) interface{} {
	// 	handler := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
	// 		resolve := args[0]
	// 		reject := args[1]

	// 		go func() {
	// 			if len(p) != 1 {
	// 				reject.Invoke(js.Global().Get("Error").New("Invalid argument count"))
	// 				return
	// 			}
	// 			configJSON := p[0].String()
	// 			var config types.Config
	// 			if err := json.Unmarshal([]byte(configJSON), &config); err != nil {
	// 				reject.Invoke(js.Global().Get("Error").New("failed to unmarshal JSON input: " + err.Error()))
	// 				return
	// 			}
	// 			result, err := core.GetSnippets(config)
	// 			if err != nil {
	// 				reject.Invoke(js.Global().Get("Error").New(err.Error()))
	// 				return
	// 			}
	// 			// Marshal the Go slice into a JSON string before returning
	// 			jsonResult, err := json.Marshal(result)
	// 			if err != nil {
	// 				reject.Invoke(js.Global().Get("Error").New("failed to marshal snippets to JSON: " + err.Error()))
	// 				return
	// 			}
	// 			resolve.Invoke(js.ValueOf(string(jsonResult)))
	// 		}()

	// 		return nil
	// 	})

	// 	defer handler.Release()

	// 	return js.Global().Get("Promise").New(handler)
	// }))
	// Keep the Go runtime alive
	select {}
}
