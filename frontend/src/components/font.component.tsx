import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useEffect, useRef, useState } from 'react';
import useAppContext from '@/store';
import { Label } from './ui/label';
import { cn, readAsRawBase64 } from '@/lib/utils';
import toast from '@/lib/toast';
import { OpenURL } from '../../wailsjs/go/main/App';

const FONT_OPTIONS = [
  'Roboto-Black',
  'Roboto-BlackItalic',
  'Roboto-Italic',
  'Roboto-Condensed',
  'Roboto-Light',
  'Minecraft',
];
const SELECT_OPTION = 'Choose a font file';

const Font = () => {
  const [fontOptions, setFontOptions] = useState(FONT_OPTIONS);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const setConfig = useAppContext(s => s.setConfig);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchAndSetFont = async (font: string) => {
    const res = await fetch(`/fonts/${font}.ttf`);
    if (!res.ok) {
      console.error('Failed to load font:', font);
      return toast({
        title: 'Error',
        message: `Failed to load the font: ${font}`,
        type: 'error',
      });
    }
    const fontBlob = await res.blob();
    const base64Font = await readAsRawBase64(
      new File([fontBlob], font, { type: fontBlob.type })
    );
    if (!base64Font) {
      console.error('Failed to read font file');
      return toast({
        title: 'Error',
        message: 'Failed to read the selected font file.',
        type: 'error',
      });
    }
    setConfig(prevConfig => ({
      ...prevConfig,
      Font: base64Font.raw,
    }));
    setSelectedFont(font);
  };
  useEffect(() => {
    if (!inputRef.current) return;
    const init = async () => {
      await fetchAndSetFont(selectedFont);
    };
    inputRef.current!.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const res = await readAsRawBase64(file);
        if (!res) {
          console.error('Failed to read file');
          return toast({
            title: 'Error',
            message: 'Failed to read the selected font file.',
            type: 'error',
          });
        }
        const { raw: base64Font } = res;
        let fontName = file.name;
        const fontAlreadyExists = fontOptions.includes(fontName);
        if (fontAlreadyExists) {
          fontName = `${file.name}-Uploaded`;
        }
        setSelectedFont(fontName);
        setFontOptions(prev => [
          // remove custom font if it already exists
          ...prev.filter(opt => FONT_OPTIONS.includes(opt)),
          fontName,
        ]);
        setConfig(prevConfig => ({
          ...prevConfig,
          Font: base64Font,
        }));
      }
    };
    init();
  }, []);

  return (
    <div className="space-y-4">
      <Label>Font</Label>
      <div className="flex items-center justify-between space-x-2">
        <Select
          value={selectedFont}
          onValueChange={async value => {
            if (value === SELECT_OPTION) {
              return inputRef.current!.click();
            }
            const previousFont = selectedFont;
            await fetchAndSetFont(value).catch(async err => {
              console.error('Error fetching font:', err);
              toast({
                title: 'Error',
                message: `Failed to load the font: ${value}`,
                type: 'error',
              });
              // make sure to revert to previous font
              await fetchAndSetFont(previousFont);
            });
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a font" />
          </SelectTrigger>
          <SelectContent
            onPaste={e => {
              console.log('e', e);
            }}
          >
            {[...fontOptions, SELECT_OPTION].map(font => (
              <SelectItem key={font} value={font}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        accept=".woff,.woff2,.ttf,.otf"
      />
    </div>
  );
};
export default Font;
