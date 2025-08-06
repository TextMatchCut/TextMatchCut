import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import useAppContext from '@/store';

const FONT_OPTIONS = ['Default', 'Inter', 'Roboto'];
const SElECT_OPTION = 'Choose a font file';

const Font = () => {
  const [fontOptions, setFontOptions] = useState(FONT_OPTIONS);
  const [selectedFont, setSelectedFont] = useState(FONT_OPTIONS[0]);
  const [customFontUrl, setCustomFontUrl] = useState('');
  const setConfig = useAppContext(s => s.setConfig);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-2">
        <Select
          value={selectedFont}
          onValueChange={value => {
            setSelectedFont(value);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a font" />
          </SelectTrigger>
          <SelectContent>
            {[...fontOptions, SElECT_OPTION].map(font => (
              <SelectItem key={font} value={font}>
                {font}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {selectedFont === SElECT_OPTION && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Select a font file from your local system
          </span>
          <Input
            type="file"
            accept=".woff,.woff2,.ttf,.otf"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  const base64Font = reader.result as string;

                  // we need raw base64 string without data URL prefix
                  //removes data:font/woff2;base64,
                  setCustomFontUrl(base64Font.split(',')[1]);
                  setConfig(prevConfig => ({
                    ...prevConfig,
                    Font: base64Font.split(',')[1],
                  }));
                };
                reader.readAsDataURL(file);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
export default Font;
