//go:build js && wasm

/*wasm entrypoint*/
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

func GO_RenderFrameWeb(input types.GO_RenderFrameWeb) (string, error) {
	snippets, err := core.GetSnippets(input.Config)
	if err != nil {
		return "", fmt.Errorf("failed to get snippets: %v", err)
	}

	return GenerateFrameAsBase64(
		input.FrameNum,
		input.Config,
		snippets,
	)
}

func main() {
	fmt.Println("Go WebAssembly module loaded!")
	js.Global().Set("GenerateFrameFromJSON", js.FuncOf(func(this js.Value, p []js.Value) interface{} {
		if len(p) != 1 {
			return js.ValueOf("Invalid argument count")
		}
		inputJSON := p[0].String()
		var input types.GO_RenderFrameWeb
		if err := json.Unmarshal([]byte(inputJSON), &input); err != nil {
			return js.ValueOf("Error: failed to unmarshal JSON input: " + err.Error())
		}

		result, err := GO_RenderFrameWeb(input)
		if err != nil {
			return js.ValueOf("Error: " + err.Error())
		}
		return js.ValueOf(result)
	}))
	js.Global().Set("GO_GetSnippets", js.FuncOf(func(this js.Value, p []js.Value) interface{} {
		handler := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			resolve := args[0]
			reject := args[1]

			go func() {
				if len(p) != 1 {
					reject.Invoke(js.Global().Get("Error").New("Invalid argument count"))
					return
				}
				configJSON := p[0].String()
				var config types.Config
				if err := json.Unmarshal([]byte(configJSON), &config); err != nil {
					reject.Invoke(js.Global().Get("Error").New("failed to unmarshal JSON input: " + err.Error()))
					return
				}
				result, err := core.GetSnippets(config)
				if err != nil {
					reject.Invoke(js.Global().Get("Error").New(err.Error()))
					return
				}
				// Marshal the Go slice into a JSON string before returning
				jsonResult, err := json.Marshal(result)
				if err != nil {
					reject.Invoke(js.Global().Get("Error").New("failed to marshal snippets to JSON: " + err.Error()))
					return
				}
				resolve.Invoke(js.ValueOf(string(jsonResult)))
			}()

			return nil
		})

		defer handler.Release()

		return js.Global().Get("Promise").New(handler)
	}))
	// Keep the Go runtime alive
	select {}
}
