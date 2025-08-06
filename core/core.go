package core

import (
	"TextMatchCut/types"
	"encoding/hex"
	"fmt"
	"image"
	"image/color"
	"math"
	"math/rand"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"

	"github.com/fogleman/gg"
	"github.com/golang/freetype/truetype"
	"golang.org/x/image/font/gofont/goregular"
)

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
func generateRandomTextSnippet(highlightedText string, minLines, maxLines int) types.TextSnippet {
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

	return types.TextSnippet{
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
func createTextImageFrame(config types.Config, snippet types.TextSnippet, fontPath string, highlightCenterX, highlightCenterY float64) (image.Image, error) {
	// Create context
	dc := gg.NewContext(config.Width, config.Height)

	backgroundImage, err := gg.LoadImage(os.TempDir() + "/textmatchcut/img/test-bg.jpg")
	if err != nil {
		return nil, fmt.Errorf("failed to load background image: %v", err)
	}
	dc.DrawImage(backgroundImage, 0, 0)
	// try to center the text
	dc.Translate(
		float64(config.Width/2-int(highlightCenterX)),
		float64(config.Height/2-int(highlightCenterY)),
	)
	// Parse colors
	bgColor := color.RGBA{
		R: config.BackgroundColor[0],
		G: config.BackgroundColor[1],
		B: config.BackgroundColor[2],
		A: config.BackgroundColor[3],
	}

	textColor := color.RGBA{
		R: config.TextColor[0],
		G: config.TextColor[1],
		B: config.TextColor[2],
		A: config.TextColor[3],
	}

	highlightColor := color.RGBA{
		R: config.HighlightColor[0],
		G: config.HighlightColor[1],
		B: config.HighlightColor[2],
		A: config.HighlightColor[3],
	}

	// Set background
	dc.SetRGBA255(int(bgColor.R), int(bgColor.G), int(bgColor.B), int(bgColor.A))
	// dc.Clear()

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

// ApplyDirectionalBlur applies a blur effect along a specified angle.
func ApplyDirectionalBlur(src image.Image, angle, length float64) *image.RGBA {
	bounds := src.Bounds()
	dst := image.NewRGBA(bounds)

	rad := angle * math.Pi / 180.0 // Convert angle to radians
	cosA := math.Cos(rad)
	sinA := math.Sin(rad)

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			var r, g, b, a, count uint32

			// Sample pixels along the line defined by the angle
			for i := -length / 2; i <= length/2; i++ {
				sampX := int(float64(x) + i*cosA)
				sampY := int(float64(y) + i*sinA)

				// Ensure the sample is within the image bounds
				if sampX >= bounds.Min.X && sampX < bounds.Max.X && sampY >= bounds.Min.Y && sampY < bounds.Max.Y {
					pr, pg, pb, pa := src.At(sampX, sampY).RGBA()
					r += pr
					g += pg
					b += pb
					a += pa
					count++
				}
			}

			if count > 0 {
				// Set the destination pixel to the average color
				dst.Set(x, y, color.RGBA{
					R: uint8((r / count) >> 8),
					G: uint8((g / count) >> 8),
					B: uint8((b / count) >> 8),
					A: uint8((a / count) >> 8),
				})
			} else {
				// If no samples were taken, copy the original pixel
				dst.Set(x, y, src.At(x, y))
			}
		}
	}
	return dst
}

// based on http://elynxsdk.free.fr/ext-docs/Blur/Fast_box_blur.pdf
func fastHorizontalBoxBlur(src image.Image, radius int) *image.RGBA {
	bounds := src.Bounds()
	width, height := bounds.Dx(), bounds.Dy()
	dst := image.NewRGBA(bounds)

	r := radius
	kernelSize := 2*r + 1

	// Try to access raw pixels if src is *image.RGBA
	srcRGBA, srcIsRGBA := src.(*image.RGBA)

	for y := 0; y < height; y++ {
		var sumR, sumG, sumB, sumA uint64

		// --- Initialize window: first pixel neighborhood ---
		for x := 0; x < kernelSize && x < width; x++ {
			var cr, cg, cb, ca uint32
			if srcIsRGBA {
				idx := srcRGBA.PixOffset(x, y)
				cr = uint32(srcRGBA.Pix[idx+0])
				cg = uint32(srcRGBA.Pix[idx+1])
				cb = uint32(srcRGBA.Pix[idx+2])
				ca = uint32(srcRGBA.Pix[idx+3])
			} else {
				// Fallback: use At() for any image type
				c := src.At(x, y)
				cr, cg, cb, ca = color.RGBAModel.Convert(c).RGBA()
				cr >>= 8 // Convert from uint16 to uint8 range
				cg >>= 8
				cb >>= 8
				ca >>= 8
			}
			sumR += uint64(cr)
			sumG += uint64(cg)
			sumB += uint64(cb)
			sumA += uint64(ca)
		}

		// Output first blurred pixel at x = r
		if r < width {
			avgR := uint8(sumR / uint64(kernelSize))
			avgG := uint8(sumG / uint64(kernelSize))
			avgB := uint8(sumB / uint64(kernelSize))
			avgA := uint8(sumA / uint64(kernelSize))
			dst.SetRGBA(r, y, color.RGBA{avgR, avgG, avgB, avgA})
		}

		// --- Slide window across the row ---
		for x := r + 1; x < width-r; x++ {
			// Remove left pixel: x - r - 1
			leftX := x - r - 1
			var lr, lg, lb, la uint32
			if srcIsRGBA {
				idx := srcRGBA.PixOffset(leftX, y)
				lr = uint32(srcRGBA.Pix[idx+0])
				lg = uint32(srcRGBA.Pix[idx+1])
				lb = uint32(srcRGBA.Pix[idx+2])
				la = uint32(srcRGBA.Pix[idx+3])
			} else {
				c := src.At(leftX, y)
				lr, lg, lb, la = color.RGBAModel.Convert(c).RGBA()
				lr >>= 8
				lg >>= 8
				lb >>= 8
				la >>= 8
			}
			sumR -= uint64(lr)
			sumG -= uint64(lg)
			sumB -= uint64(lb)
			sumA -= uint64(la)

			// Add right pixel: x + r
			rightX := x + r
			var rr, rg, rb, ra uint32
			if srcIsRGBA {
				idx := srcRGBA.PixOffset(rightX, y)
				rr = uint32(srcRGBA.Pix[idx+0])
				rg = uint32(srcRGBA.Pix[idx+1])
				rg = uint32(srcRGBA.Pix[idx+1])
				rb = uint32(srcRGBA.Pix[idx+2])
				ra = uint32(srcRGBA.Pix[idx+3])
			} else {
				c := src.At(rightX, y)
				rr, rg, rb, ra = color.RGBAModel.Convert(c).RGBA()
				rr >>= 8
				rg >>= 8
				rb >>= 8
				ra >>= 8
			}
			sumR += uint64(rr)
			sumG += uint64(rg)
			sumB += uint64(rb)
			sumA += uint64(ra)

			avgR := uint8(sumR / uint64(kernelSize))
			avgG := uint8(sumG / uint64(kernelSize))
			avgB := uint8(sumB / uint64(kernelSize))
			avgA := uint8(sumA / uint64(kernelSize))
			dst.SetRGBA(x, y, color.RGBA{avgR, avgG, avgB, avgA})
		}
	}

	return dst
}

// Efficient box blur implementation based on Pillow's algorithm
// https://github.com/python-pillow/Pillow/blob/main/src/libImaging/BoxBlur.c
func boxBlurHorizontal(src *image.RGBA, radius float64) *image.RGBA {
	bounds := src.Bounds()
	width, height := bounds.Dx(), bounds.Dy()
	dst := image.NewRGBA(bounds)

	iRadius := int(radius)
	ww := uint32((1 << 24) / (radius*2 + 1))
	fw := (uint32(1<<24) - uint32(iRadius*2+1)*ww) / 2

	edgeA := min(iRadius+1, width)
	edgeB := max(width-iRadius-1, 0)
	lastX := width - 1

	// Process each row
	for y := 0; y < height; y++ {
		srcRow := src.Pix[y*src.Stride:]
		dstRow := dst.Pix[y*dst.Stride:]

		// Initialize accumulator for pixel at x=-1
		var acc [4]uint32

		// Add first pixel (radius+1) times
		acc[0] = uint32(srcRow[0]) * uint32(iRadius+1)
		acc[1] = uint32(srcRow[1]) * uint32(iRadius+1)
		acc[2] = uint32(srcRow[2]) * uint32(iRadius+1)
		acc[3] = uint32(srcRow[3]) * uint32(iRadius+1)

		// Add pixels from 0 to edgeA-1
		for x := 0; x < edgeA-1; x++ {
			idx := x * 4
			acc[0] += uint32(srcRow[idx])
			acc[1] += uint32(srcRow[idx+1])
			acc[2] += uint32(srcRow[idx+2])
			acc[3] += uint32(srcRow[idx+3])
		}

		// Add last pixel for remaining radius
		if iRadius >= edgeA {
			lastIdx := lastX * 4
			mult := uint32(iRadius - edgeA + 1)
			acc[0] += uint32(srcRow[lastIdx]) * mult
			acc[1] += uint32(srcRow[lastIdx+1]) * mult
			acc[2] += uint32(srcRow[lastIdx+2]) * mult
			acc[3] += uint32(srcRow[lastIdx+3]) * mult
		}

		// Apply blur using sliding window
		if edgeA <= edgeB {
			// Phase 1: x = 0 to edgeA-1
			for x := 0; x < edgeA; x++ {
				// Move accumulator: subtract left(0), add right(x+radius)
				rightIdx := (x + iRadius) * 4
				acc[0] += uint32(srcRow[rightIdx]) - uint32(srcRow[0])
				acc[1] += uint32(srcRow[rightIdx+1]) - uint32(srcRow[1])
				acc[2] += uint32(srcRow[rightIdx+2]) - uint32(srcRow[2])
				acc[3] += uint32(srcRow[rightIdx+3]) - uint32(srcRow[3])

				// Calculate output
				farLeftIdx := 0
				farRightIdx := min((x+iRadius+1)*4, lastX*4)

				bulk := [4]uint32{
					acc[0]*ww + (uint32(srcRow[farLeftIdx])+uint32(srcRow[farRightIdx]))*fw,
					acc[1]*ww + (uint32(srcRow[farLeftIdx+1])+uint32(srcRow[farRightIdx+1]))*fw,
					acc[2]*ww + (uint32(srcRow[farLeftIdx+2])+uint32(srcRow[farRightIdx+2]))*fw,
					acc[3]*ww + (uint32(srcRow[farLeftIdx+3])+uint32(srcRow[farRightIdx+3]))*fw,
				}

				outIdx := x * 4
				dstRow[outIdx] = uint8((bulk[0] + (1 << 23)) >> 24)
				dstRow[outIdx+1] = uint8((bulk[1] + (1 << 23)) >> 24)
				dstRow[outIdx+2] = uint8((bulk[2] + (1 << 23)) >> 24)
				dstRow[outIdx+3] = uint8((bulk[3] + (1 << 23)) >> 24)
			}

			// Phase 2: x = edgeA to edgeB-1
			for x := edgeA; x < edgeB; x++ {
				// Move accumulator: subtract left(x-radius-1), add right(x+radius)
				leftIdx := (x - iRadius - 1) * 4
				rightIdx := (x + iRadius) * 4

				acc[0] += uint32(srcRow[rightIdx]) - uint32(srcRow[leftIdx])
				acc[1] += uint32(srcRow[rightIdx+1]) - uint32(srcRow[leftIdx+1])
				acc[2] += uint32(srcRow[rightIdx+2]) - uint32(srcRow[leftIdx+2])
				acc[3] += uint32(srcRow[rightIdx+3]) - uint32(srcRow[leftIdx+3])

				// Calculate output
				farLeftIdx := leftIdx
				farRightIdx := min((x+iRadius+1)*4, lastX*4)

				bulk := [4]uint32{
					acc[0]*ww + (uint32(srcRow[farLeftIdx])+uint32(srcRow[farRightIdx]))*fw,
					acc[1]*ww + (uint32(srcRow[farLeftIdx+1])+uint32(srcRow[farRightIdx+1]))*fw,
					acc[2]*ww + (uint32(srcRow[farLeftIdx+2])+uint32(srcRow[farRightIdx+2]))*fw,
					acc[3]*ww + (uint32(srcRow[farLeftIdx+3])+uint32(srcRow[farRightIdx+3]))*fw,
				}

				outIdx := x * 4
				dstRow[outIdx] = uint8((bulk[0] + (1 << 23)) >> 24)
				dstRow[outIdx+1] = uint8((bulk[1] + (1 << 23)) >> 24)
				dstRow[outIdx+2] = uint8((bulk[2] + (1 << 23)) >> 24)
				dstRow[outIdx+3] = uint8((bulk[3] + (1 << 23)) >> 24)
			}

			// Phase 3: x = edgeB to lastX
			for x := edgeB; x <= lastX; x++ {
				// Move accumulator: subtract left(x-radius-1), add right(lastX)
				leftIdx := (x - iRadius - 1) * 4
				lastIdx := lastX * 4

				acc[0] += uint32(srcRow[lastIdx]) - uint32(srcRow[leftIdx])
				acc[1] += uint32(srcRow[lastIdx+1]) - uint32(srcRow[leftIdx+1])
				acc[2] += uint32(srcRow[lastIdx+2]) - uint32(srcRow[leftIdx+2])
				acc[3] += uint32(srcRow[lastIdx+3]) - uint32(srcRow[leftIdx+3])

				// Calculate output
				bulk := [4]uint32{
					acc[0]*ww + (uint32(srcRow[leftIdx])+uint32(srcRow[lastIdx]))*fw,
					acc[1]*ww + (uint32(srcRow[leftIdx+1])+uint32(srcRow[lastIdx+1]))*fw,
					acc[2]*ww + (uint32(srcRow[leftIdx+2])+uint32(srcRow[lastIdx+2]))*fw,
					acc[3]*ww + (uint32(srcRow[leftIdx+3])+uint32(srcRow[lastIdx+3]))*fw,
				}

				outIdx := x * 4
				dstRow[outIdx] = uint8((bulk[0] + (1 << 23)) >> 24)
				dstRow[outIdx+1] = uint8((bulk[1] + (1 << 23)) >> 24)
				dstRow[outIdx+2] = uint8((bulk[2] + (1 << 23)) >> 24)
				dstRow[outIdx+3] = uint8((bulk[3] + (1 << 23)) >> 24)
			}
		}
		// Handle edgeA > edgeB case (similar logic but different phases)
	}

	return dst
}

func ApplyHorizontalBlur(src image.Image, options types.EfficientVariableDirectionalBlurOptions) *image.RGBA {
	bounds := src.Bounds()
	numCPU := runtime.NumCPU()

	// Step 1: Create multiple blur levels concurrently.
	blurLevels := make([]image.Image, options.BlurSteps+1)
	blurLevels[0] = src // Original (no blur)

	var wg sync.WaitGroup
	for i := 1; i <= options.BlurSteps; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			length := options.MaxLength * float64(i) / float64(options.BlurSteps)
			blurLevels[i] = fastHorizontalBoxBlur(src, int(length))
		}(i)
	}
	wg.Wait()

	result := image.NewRGBA(bounds)
	centerX := float64(options.CenterX)
	centerY := float64(options.CenterY)
	maxRadius := options.Radius
	featherAmount := options.Feather

	// Step 2: Compose the final image by interpolating between blur levels, also concurrently.
	rowsPerGoroutine := (bounds.Max.Y - bounds.Min.Y + numCPU - 1) / numCPU
	for i := 0; i < numCPU; i++ {
		startY := bounds.Min.Y + i*rowsPerGoroutine
		endY := startY + rowsPerGoroutine
		if endY > bounds.Max.Y {
			endY = bounds.Max.Y
		}

		wg.Add(1)
		go func(startY, endY int) {
			defer wg.Done()
			for y := startY; y < endY; y++ {
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
						blurIntensity = (1 - math.Cos(blurIntensity*math.Pi)) / 2 // Smoothing
					} else {
						blurIntensity = 1.0
					}

					// Map blur intensity to blur levels
					levelFloat := blurIntensity * float64(options.BlurSteps)
					level := int(levelFloat)
					fraction := levelFloat - float64(level)

					var c color.Color
					if level >= options.BlurSteps {
						// Use maximum blur
						c = blurLevels[options.BlurSteps].At(x, y)
					} else if fraction < 1e-9 {
						// Use exact level
						c = blurLevels[level].At(x, y)
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

						c = color.RGBA{r, g, b, a}
					}
					result.Set(x, y, c)
				}
			}
		}(startY, endY)
	}
	wg.Wait()

	return result
}

// Fast Directional Box Blur - based on Pillow's algorithm (can be optimized further i believe)
func FastDirectionalBlur(src image.Image, angle, length float64) *image.RGBA {
	bounds := src.Bounds()
	dst := image.NewRGBA(bounds)

	rad := angle * math.Pi / 180.0 // Convert angle to radians
	cosA := math.Cos(rad)
	sinA := math.Sin(rad)
	halfLength := int(length / 2)

	// Convert to RGBA if needed for faster access
	var srcRGBA *image.RGBA
	if rgba, ok := src.(*image.RGBA); ok {
		srcRGBA = rgba
	} else {
		srcRGBA = image.NewRGBA(bounds)
		for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
			for x := bounds.Min.X; x < bounds.Max.X; x++ {
				srcRGBA.Set(x, y, src.At(x, y))
			}
		}
	}

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			var r, g, b, a uint64
			var count uint32

			// Sample pixels along the line defined by the angle
			for i := -halfLength; i <= halfLength; i++ {
				sampX := x + int(float64(i)*cosA)
				sampY := y + int(float64(i)*sinA)

				// Ensure the sample is within the image bounds
				if sampX >= bounds.Min.X && sampX < bounds.Max.X &&
					sampY >= bounds.Min.Y && sampY < bounds.Max.Y {
					idx := srcRGBA.PixOffset(sampX, sampY)
					r += uint64(srcRGBA.Pix[idx])
					g += uint64(srcRGBA.Pix[idx+1])
					b += uint64(srcRGBA.Pix[idx+2])
					a += uint64(srcRGBA.Pix[idx+3])
					count++
				}
			}

			if count > 0 {
				// Set the destination pixel to the average color
				idx := dst.PixOffset(x, y)
				dst.Pix[idx] = uint8(r / uint64(count))
				dst.Pix[idx+1] = uint8(g / uint64(count))
				dst.Pix[idx+2] = uint8(b / uint64(count))
				dst.Pix[idx+3] = uint8(a / uint64(count))
			} else {
				// If no samples were taken, copy the original pixel
				dst.Set(x, y, src.At(x, y))
			}
		}
	}
	return dst
}

// Main Gaussian blur function
func FastGaussianBlur(src image.Image, radius float64) *image.RGBA {
	// Convert to RGBA if needed
	var srcRGBA *image.RGBA
	if rgba, ok := src.(*image.RGBA); ok {
		srcRGBA = rgba
	} else {
		bounds := src.Bounds()
		srcRGBA = image.NewRGBA(bounds)
		for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
			for x := bounds.Min.X; x < bounds.Max.X; x++ {
				srcRGBA.Set(x, y, src.At(x, y))
			}
		}
	}

	passes := 3
	boxRadius := gaussianBlurRadius(radius, passes)

	// Horizontal blur
	result := srcRGBA
	for i := 0; i < passes; i++ {
		result = boxBlurHorizontal(result, boxRadius)
	}

	// Vertical blur (transpose, horizontal blur, transpose back)
	transposed := transposeImage(result)
	for i := 0; i < passes; i++ {
		transposed = boxBlurHorizontal(transposed, boxRadius)
	}
	result = transposeImage(transposed)

	return result
}

// ApplyDirectionalBlurFeathered - optimized version using FastDirectionalBlur
func ApplyDirectionalBlurFeathered(src image.Image, options types.EfficientVariableDirectionalBlurOptions) *image.RGBA {
	bounds := src.Bounds()

	// Use fast directional blur on the entire image
	blurred := FastDirectionalBlur(src, -options.Angle, options.MaxLength)

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
				// Inside the solid cutout area - no blur
				blurIntensity = 0.0
			} else if distance <= maxRadius {
				// In the feather zone - gradual transition
				featherStart := maxRadius * (1 - featherAmount)
				featherRange := maxRadius - featherStart
				blurIntensity = (distance - featherStart) / featherRange
				// Apply smooth cosine interpolation for natural falloff
				blurIntensity = (1 - math.Cos(blurIntensity*math.Pi)) / 2
			} else {
				// Outside the radius - full blur
				blurIntensity = 1.0
			}

			// Interpolate between original and blurred image based on blur intensity
			if blurIntensity <= 0 {
				// No blur - use original
				result.Set(x, y, src.At(x, y))
			} else if blurIntensity >= 1 {
				// Full blur - use directionally blurred
				result.Set(x, y, blurred.At(x, y))
			} else {
				// Interpolate between original and directionally blurred
				origColor := src.At(x, y)
				blurColor := blurred.At(x, y)

				r1, g1, b1, a1 := origColor.RGBA()
				r2, g2, b2, a2 := blurColor.RGBA()

				// Interpolate each channel
				r := uint8((float64(r1>>8)*(1-blurIntensity) + float64(r2>>8)*blurIntensity))
				g := uint8((float64(g1>>8)*(1-blurIntensity) + float64(g2>>8)*blurIntensity))
				b := uint8((float64(b1>>8)*(1-blurIntensity) + float64(b2>>8)*blurIntensity))
				a := uint8((float64(a1>>8)*(1-blurIntensity) + float64(a2>>8)*blurIntensity))

				result.Set(x, y, color.RGBA{r, g, b, a})
			}
		}
	}

	return result
}

func ApplyGaussianBlur(src image.Image, options types.EfficientVariableBlurOptions) *image.RGBA {
	bounds := src.Bounds()

	// Use fast Gaussian blur
	blurred := FastGaussianBlur(src, options.MaxBlur)

	result := image.NewRGBA(bounds)
	centerX := float64(options.CenterX)
	centerY := float64(options.CenterY)
	cutoutRadius := options.Radius

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			dx := float64(x) - centerX
			dy := float64(y) - centerY
			distance := math.Sqrt(dx*dx + dy*dy)

			if distance <= cutoutRadius {
				result.Set(x, y, src.At(x, y))
			} else {
				result.Set(x, y, blurred.At(x, y))
			}
		}
	}

	return result
}

// ApplyGaussianBlurFeathered creates a feathered blur effect using the fast Gaussian implementation
func ApplyGaussianBlurFeathered(src image.Image, options types.EfficientVariableBlurOptions) *image.RGBA {
	bounds := src.Bounds()

	// Use fast Gaussian blur
	blurred := FastGaussianBlur(src, options.MaxBlur)

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
				// Inside the solid cutout area - no blur
				blurIntensity = 0.0
			} else if distance <= maxRadius {
				// In the feather zone - gradual transition
				featherStart := maxRadius * (1 - featherAmount)
				featherRange := maxRadius - featherStart
				blurIntensity = (distance - featherStart) / featherRange
				// Apply smooth cosine interpolation for natural falloff
				blurIntensity = (1 - math.Cos(blurIntensity*math.Pi)) / 2
			} else {
				// Outside the radius - full blur
				blurIntensity = 1.0
			}

			// Interpolate between original and blurred image based on blur intensity
			if blurIntensity <= 0 {
				// No blur - use original
				result.Set(x, y, src.At(x, y))
			} else if blurIntensity >= 1 {
				// Full blur - use blurred
				result.Set(x, y, blurred.At(x, y))
			} else {
				// Interpolate between original and blurred
				origColor := src.At(x, y)
				blurColor := blurred.At(x, y)

				r1, g1, b1, a1 := origColor.RGBA()
				r2, g2, b2, a2 := blurColor.RGBA()

				// Interpolate each channel
				r := uint8((float64(r1>>8)*(1-blurIntensity) + float64(r2>>8)*blurIntensity))
				g := uint8((float64(g1>>8)*(1-blurIntensity) + float64(g2>>8)*blurIntensity))
				b := uint8((float64(b1>>8)*(1-blurIntensity) + float64(b2>>8)*blurIntensity))
				a := uint8((float64(a1>>8)*(1-blurIntensity) + float64(a2>>8)*blurIntensity))

				result.Set(x, y, color.RGBA{r, g, b, a})
			}
		}
	}

	return result
}

// Calculate the center position of highlighted text in a text snippet
func calculateHighlightPosition(config types.Config, snippet types.TextSnippet, fontPath string) (float64, float64, error) {
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

func GenerateFrame(frameNum int, config types.Config, aiSnippets []types.TextSnippet, fontFiles []string, highlightRadius float64) (image.Image, error) {
	var snippet types.TextSnippet
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
		return nil, fmt.Errorf("failed to calculate highlight position for frame %d: %v", frameNum, err)
	}

	// Generate frame
	fmt.Printf("X and Y coordinates for highlight: %.2f, %.2f\n", highlightCenterX, highlightCenterY)
	img, err := createTextImageFrame(config, snippet, fontPath, highlightCenterX, highlightCenterY)
	if err != nil {
		if config.Verbose {
			fmt.Printf("Warning: Failed to generate frame %d: %v\n", frameNum, err)
		}
		// // Try with embedded font as fallback
		// img, err = createTextImageFrame(config, snippet, "embedded", highlightCenterX, highlightCenterY)
		// if err != nil {
		// 	return nil, fmt.Errorf("failed to generate frame %d even with fallback font: %v", frameNum, err)
		// }
		// // Recalculate position with embedded font
		// highlightCenterX, highlightCenterY, _ = calculateHighlightPosition(config, snippet, "embedded")
		return nil, fmt.Errorf("failed to generate frame %d: %v", frameNum, err)
	}

	var finalImage image.Image = img

	switch config.BlurType {
	case "directional":
		finalImage = ApplyDirectionalBlurFeathered(img, types.EfficientVariableDirectionalBlurOptions{
			CenterX: config.Width / 2,
			CenterY: config.Height / 2,
			Radius:  highlightRadius,
			// MaxLength: config.BlurRadius,
			// Angle:     config.BlurAngle,
			// Feather:   0.1,
			// BlurSteps: 3,
			MaxLength: 55,
			Angle:     150,
			Feather:   1,
			BlurSteps: 3,
		})
	case "gaussian-no-feather":
		// Apply the existing variable blur
		finalImage = ApplyGaussianBlur(img, types.EfficientVariableBlurOptions{
			CenterX:   config.Width / 2,
			CenterY:   config.Height / 2,
			Radius:    highlightRadius,
			MaxBlur:   config.BlurRadius,
			Feather:   0, // No feathering
			BlurSteps: 20,
		})
	case "gaussian":
		finalImage = ApplyGaussianBlurFeathered(img, types.EfficientVariableBlurOptions{
			CenterX:   config.Width / 2,
			CenterY:   config.Height / 2,
			Radius:    highlightRadius,
			MaxBlur:   config.BlurRadius,
			Feather:   0.5,
			BlurSteps: 20,
		})
	case "horizontal":
		// Apply the efficient horizontal box blur
		finalImage = ApplyHorizontalBlur(img, types.EfficientVariableDirectionalBlurOptions{
			CenterX: config.Width / 2,
			CenterY: config.Height / 2,
			Radius:  highlightRadius,
			// MaxLength: config.BlurRadius,
			// Angle:     config.BlurAngle,
			// Feather:   0.1,
			// BlurSteps: 3,
			MaxLength: 20,
			Angle:     225,
			Feather:   1,
			BlurSteps: 3,
		})
	default:
		//    throw error
		return nil, fmt.Errorf("Blur type didn't match a known type")
	}

	return finalImage, nil
}

// Transpose image for vertical blur
func transposeImage(src *image.RGBA) *image.RGBA {
	bounds := src.Bounds()
	width, height := bounds.Dx(), bounds.Dy()
	dst := image.NewRGBA(image.Rect(0, 0, height, width))

	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			srcIdx := y*src.Stride + x*4
			dstIdx := x*dst.Stride + y*4
			copy(dst.Pix[dstIdx:dstIdx+4], src.Pix[srcIdx:srcIdx+4])
		}
	}
	return dst
}

// Gaussian blur radius calculation (same as Pillow)
func gaussianBlurRadius(radius float64, passes int) float64 {
	sigma2 := radius * radius / float64(passes)
	L := math.Sqrt(12.0*sigma2 + 1.0)
	l := math.Floor((L - 1.0) / 2.0)
	a := (2*l + 1) * (l*(l+1) - 3*sigma2)
	a /= 6 * (sigma2 - (l+1)*(l+1))
	return l + a
}
