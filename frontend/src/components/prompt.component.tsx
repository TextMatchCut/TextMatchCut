import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import useAppContext from '@/store';
import { useState } from 'react';
import { OpenURL } from '../../wailsjs/go/main/App';
import { useFormContext, Controller } from 'react-hook-form';
import { cn } from '@/lib/utils';

const FieldError: React.FC<{ error?: any }> = ({ error }) => {
  if (!error) return null;
  return <p className="text-red-500 text-xs mt-1">{error.message as string}</p>;
};

const Prompt = () => {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext();

  const config = useAppContext(s => s.config);
  const setConfig = useAppContext(s => s.setConfig);
  const [promptText, setPromptText] = useState(
    "Respond with 5 different text snippets with the highlighted text '$HighlightedText'. Each snippet should have between $MinLines and $MaxLines lines. Make sure that the highlighted text is not always at the start but random"
  );

  const parsePrompt = (prompt: string) => {
    return prompt
      .replace(
        /\$HighlightedText/g,
        config?.HighlightedText || '[HighlightedText]'
      )
      .replace(/\$MinLines/g, config?.MinLines?.toString() || '[MinLines]')
      .replace(/\$MaxLines/g, config?.MaxLines?.toString() || '[MaxLines]')
      .replace(/\$Duration/g, config?.Duration?.toString() || '[Duration]')
      .replace(/\$Width/g, config?.Width?.toString() || '[Width]')
      .replace(/\$Height/g, config?.Height?.toString() || '[Height]')
      .replace(/\$FPS/g, config?.FPS?.toString() || '[FPS]')
      .replace(/\$Font/g, config?.Font || '[Font]');
  };

  return (
    <div className="max-w-[600px] m-auto my-5">
      <Tabs
        defaultValue={config.AIEnabled ? config.Provider : 'random'}
        onValueChange={value => {
          setConfig(prevConfig => ({
            ...prevConfig,
            ...(value === 'gemini'
              ? {
                  AIEnabled: true,
                  Provider: 'gemini',
                  Model: 'gemini-2.5-flash',
                }
              : value === 'openai'
              ? {
                  AIEnabled: true,
                  Provider: 'openai',
                  Model: 'gpt-3.5-turbo',
                }
              : { AIEnabled: false, Provider: '', Model: '' }),
          }));
        }}
      >
        <TabsList className="m-auto">
          <TabsTrigger className="cursor-pointer" value="random">
            Random Keywords
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="gemini">
            Use Gemini
          </TabsTrigger>
          <TabsTrigger className="cursor-pointer" value="openai">
            Use OpenAI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="random">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Generate text snippets using random keywords
            </p>
          </div>
        </TabsContent>

        <TabsContent value="gemini">
          <div className="space-y-4">
            <div className="flex gap-4 items-center align-center justify-center">
              <div>
                <Label htmlFor="gemini-model">Gemini Model</Label>
                <Controller
                  defaultValue={'gemini-2.5-flash'}
                  control={control}
                  name="Model"
                  render={({ field }) => (
                    <Input
                      id="gemini-model"
                      placeholder="e.g., gemini-2.5-flash"
                      {...field}
                      className={cn({ 'border-red-500': errors.Model })}
                    />
                  )}
                />
                <FieldError error={errors.Model} />
              </div>
              <div>
                <Label htmlFor="gemini-api-key">API key</Label>
                <Controller
                  defaultValue={''}
                  control={control}
                  name="ApiKey"
                  render={({ field }) => (
                    <Input
                      id="gemini-api-key"
                      placeholder="Enter your Gemini API key"
                      {...field}
                      className={cn({ 'border-red-500': errors.ApiKey })}
                    />
                  )}
                />
                <FieldError error={errors.ApiKey} />
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Get your free Api key at {'  '}
              {!__DESKTOP__ ? (
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  https://aistudio.google.com/apikey
                </a>
              ) : (
                <p
                  className="text-blue-500 hover:underline cursor-pointer"
                  onClick={() => OpenURL('https://aistudio.google.com/apikey')}
                >
                  https://aistudio.google.com/apikey
                </p>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="openai" className="w-full">
          <div className="space-y-4 w-full">
            <div className="w-full flex gap-4 items-center align-center justify-center">
              <div>
                <Label htmlFor="openai-model">OpenAI Model</Label>
                <Controller
                  control={control}
                  name="Model"
                  render={({ field }) => (
                    <Input
                      id="openai-model"
                      placeholder="e.g., gpt-4o, gpt-3.5-turbo"
                      {...field}
                      className={cn({ 'border-red-500': errors.Model })}
                    />
                  )}
                />
                <FieldError error={errors.Model} />
              </div>
              <div>
                <Label htmlFor="openai-api-key">API key</Label>
                <Controller
                  control={control}
                  name="ApiKey"
                  defaultValue={''}
                  render={({ field }) => (
                    <Input
                      id="openai-api-key"
                      placeholder="Enter your OpenAI API key"
                      {...field}
                      className={cn({ 'border-red-500': errors.ApiKey })}
                    />
                  )}
                />
                <FieldError error={errors.ApiKey} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      {config.AIEnabled && (
        <>
          <div className="mt-4">
            <Label htmlFor="openai-prompt">Prompt Template</Label>
            <textarea
              className="w-full p-2 border rounded-md mt-2"
              id="openai-prompt"
              placeholder="Enter your prompt template..."
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Available variables: $HighlightedText, $MinLines, $MaxLines,
              $Duration, $Width, $Height, $FPS, $Font
            </p>
          </div>
          <div>
            <Label>Preview (with current config values):</Label>
            <div className="p-3 bg-muted rounded-md text-sm">
              {parsePrompt(promptText)}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Prompt;
