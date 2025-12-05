package main

import (
	"embed"
	"fmt"
	"os"
	"path/filepath"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
)

//go:embed all:frontend/dist
var assets embed.FS

//go:embed all:frontend/public/sfx
var sfxAssets embed.FS

//go:embed all:frontend/public/img
var imgAssets embed.FS

//go:embed build/appicon.png
var icon []byte

func main() {
	// Create an instance of the app structure

	// save sfx and img assets so ffmpeg can access it
	err := writeAssets("sfx", sfxAssets)
	if err != nil {
		println("Error writing sfx assets:", err.Error())
		return
	}
	err = writeAssets("img", imgAssets)
	if err != nil {
		println("Error writing img assets:", err.Error())
		return
	}

	app := NewApp()

	// Create application with options
	err = wails.Run(&options.App{
		Title:     "TextMatchCut",
		Width:     1024,
		Height:    768,
		MinWidth:  950,
		MinHeight: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		Mac: &mac.Options{
			About: &mac.AboutInfo{
				Title:   "My Application",
				Message: "© 2021 Me",
				Icon:    icon,
			},
		},
		BackgroundColour: &options.RGBA{R: 27, G: 38, B: 54, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}

func writeAssets(dir string, fs embed.FS) error {
	tempSubDir := filepath.Join(os.TempDir(), "textmatchcut", dir)
	err := os.MkdirAll(tempSubDir, 0755)
	if err != nil {
		return fmt.Errorf("failed to create temp subdirectory: %v", err)
	}
	res, err := fs.ReadDir(fmt.Sprintf("frontend/public/%s", dir))
	if err != nil {
		println("Error:", err.Error())
		return err
	}

	for _, file := range res {
		fmt.Printf("Processing file: %s\n", file.Name())
		if file.IsDir() {
			continue
		}
		src, err := fs.ReadFile(fmt.Sprintf("frontend/public/%s/%s", dir, file.Name()))
		if err != nil {
			println("Error reading file:", err.Error())
			return err
		}
		err = os.WriteFile(tempSubDir+"/"+file.Name(), src, 0644)
		if err != nil {
			println("Error writing file:", err.Error())
			return err
		}
	}
	return nil
}
