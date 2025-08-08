import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Resolution from '@/components/resolution.component';
import { Label } from '@/components/ui/label';
import { BlurType } from '@types';
import useAppContext from '@/store';
import { rgbaToHex, hexToRgba, cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import Sfx from './sfx.component';
import SfxWeb from './sfx.web.component';
import BackgroundInput from './background-input.component';
import Font from './font.component';
import Prompt from './prompt.component';

const ConfigForm: React.FC<React.PropsWithChildren> = ({ children }) => {
  const setConfig = useAppContext(s => s.setConfig);
  const config = useAppContext(s => s.config);
  return (
    <>
      <div className="flex gap-4 justify-between flex-col md:flex-row">
        <div className="flex gap-4 w-full">
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
            <Label htmlFor="blur-type">Blur Type</Label>
            <div className="flex items-center justify-between space-x-2">
              <Select
                defaultValue={config.BlurType}
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
        </div>
        <div className="flex w-full items-center space-x-4">
          <div className="w-full">
            <Label htmlFor="highlight-color">Highlight Color</Label>
            <Input
              className="max-w-[85%]"
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
          <div className="w-full">
            <Label htmlFor="text-color">Text Color</Label>
            <Input
              className="max-w-[85%]"
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
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 m-4 items-center place-content-center justify-center">
        <div className="flex gap-2">
          <Label htmlFor="font-size">Font Size</Label>
          <Input
            className="w-20"
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
        <div className="flex gap-2">
          <Label htmlFor="min-lines">Min Lines</Label>
          <Input
            className="w-20"
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
        <div className="flex gap-2">
          <Label htmlFor="max-lines">Max Lines</Label>
          <Input
            className="w-20"
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
        <div className="flex gap-2">
          <Label htmlFor="vertical-spread">Vertical Spread</Label>
          <Input
            className="w-20"
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
        <div className="flex gap-2">
          <Label htmlFor="feather">Feather</Label>
          <Input
            className="w-20"
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
      </div>
      <div
        className={cn('flex gap-4 flex-col md:flex-row', {
          'min-w-[800px]': __DESKTOP__,
        })}
      >
        <BackgroundInput />
        {__DESKTOP__ ? <Sfx /> : <SfxWeb />}
        <Font />
      </div>
      <div>
        <Prompt />
      </div>
      <Resolution />

      {children}
    </>
  );
};

export default ConfigForm;
