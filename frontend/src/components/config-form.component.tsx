import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import WidthHeight from '@/components/width-height.component';
import { Label } from '@/components/ui/label';
import { BlurType } from '@types';
import useAppContext from '@/store';
import { rgbaToHex, hexToRgba } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import Sfx from './sfx.component';
import SfxWeb from './sfx.web.component';

const ConfigForm: React.FC<React.PropsWithChildren> = ({ children }) => {
  const setConfig = useAppContext(s => s.setConfig);
  const config = useAppContext(s => s.config);
  return (
    <>
      <div>
        <Label htmlFor="highlighted-text">Highlighted Text</Label>
        <Input
          id="highlighted-text"
          value={config.HighlightedText}
          onChange={e =>
            setConfig({
              ...config,
              HighlightedText: e.target.value,
            })
          }
        />
      </div>
      <div>
        <Label htmlFor="highlight-color">Highlight Color</Label>
        <Input
          id="highlight-color"
          type="color"
          value={rgbaToHex(
            config.HighlightColor as [number, number, number, number],
            false
          )}
          onChange={e => {
            console.log(
              `Setting highlight color to ${hexToRgba(e.target.value)}`
            );
            setConfig({
              ...config,
              HighlightColor: hexToRgba(e.target.value),
            });
          }}
        />
      </div>
      <div>
        <Label htmlFor="text-color">Text Color</Label>
        <Input
          id="text-color"
          type="color"
          value={rgbaToHex(
            config.TextColor as [number, number, number, number],
            false
          )}
          onChange={e =>
            setConfig({
              ...config,
              TextColor: hexToRgba(e.target.value),
            })
          }
        />
      </div>
      <div>
        <Label htmlFor="background-color">Background Color</Label>
        <Input
          id="background-color"
          type="color"
          value={rgbaToHex(
            config.BackgroundColor as [number, number, number, number],
            false
          )}
          onChange={e => {
            setConfig({
              ...config,
              BackgroundColor: hexToRgba(e.target.value),
            });
          }}
        />
      </div>
      <div>
        <Label htmlFor="font-size">Font Size</Label>
        <Input
          id="font-size"
          type="number"
          value={config.FontSize}
          onChange={e =>
            setConfig({
              ...config,
              FontSize: parseInt(e.target.value),
            })
          }
        />
      </div>
      <div>
        <Label htmlFor="min-lines">Min Lines</Label>
        <Input
          id="min-lines"
          type="number"
          value={config.MinLines}
          onChange={e =>
            setConfig({
              ...config,
              MinLines: parseInt(e.target.value),
            })
          }
        />
      </div>
      <div>
        <Label htmlFor="max-lines">Max Lines</Label>
        <Input
          id="max-lines"
          type="number"
          value={config.MaxLines}
          onChange={e =>
            setConfig({
              ...config,
              MaxLines: parseInt(e.target.value),
            })
          }
        />
      </div>
      <div>
        <Label htmlFor="vertical-spread">Vertical Spread</Label>
        <Input
          id="vertical-spread"
          type="number"
          value={config.VerticalSpread}
          onChange={e =>
            setConfig({
              ...config,
              VerticalSpread: parseFloat(e.target.value),
            })
          }
        />
      </div>
      <div>
        <Label htmlFor="feather">Feather</Label>
        <Input
          id="feather"
          type="number"
          value={config.Feather}
          onChange={e =>
            setConfig({
              ...config,
              Feather: parseFloat(e.target.value),
            })
          }
        />
      </div>
      <div>
        <Label htmlFor="blur-type">Blur Type</Label>
        <div className="flex items-center justify-between space-x-2">
          <Select
            defaultValue={BlurType.Horizontal}
            onValueChange={value => {
              setConfig({
                ...config,
                BlurType: value as BlurType,
              });
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Blur Type" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(BlurType).map(type => (
                <SelectItem
                  key={type}
                  value={BlurType[type as keyof typeof BlurType]}
                >
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <WidthHeight />

      {__DESKTOP__ ? <Sfx /> : <SfxWeb />}

      {children}
    </>
  );
};

export default ConfigForm;
