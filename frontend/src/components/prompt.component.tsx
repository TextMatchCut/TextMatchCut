import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect, useState } from 'react';
import { OpenURL } from '../../wailsjs/go/main/App';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import {
  DEFAULT_SUGGESTED_GEMINI_MODEL,
  DEFAULT_SUGGESTED_OPENAI_MODEL,
} from '@constants';

const FieldError: React.FC<{ error?: any }> = ({ error }) => {
  if (!error) return null;
  return <p className="text-red-500 text-xs mt-1">{error.message as string}</p>;
};

const Prompt = () => {
  const {
    control,
    register,
    formState: { errors },
    setValue,
    getValues,
    watch,
  } = useFormContext();
  const config = getValues();
  const { AIEnabled } = watch();
  // const config = useAppContext(s => s.config);
  // const setConfig = useAppContext(s => s.setConfig);
  const [promptText, setPromptText] = useState(
    "Respond with $SnippetSize different text snippets including the word '$HighlightedText' in a meaningful way. Each snippet should have between $MinLines and $MaxLines sentences. Make sure that the word $HighlightedText is not always at the start but random."
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
      .replace(/\$Font/g, config?.Font || '[Font]')
      .replace(
        /\$SnippetSize/g,
        config?.SnippetSize?.toString() || '[SnippetSize]'
      );
  };

  const parsedText = parsePrompt(promptText);

  useEffect(() => {
    setValue('Prompt', parsedText);
  });

  return (
    <div className="max-w-[600px] m-auto my-5">
      <Tabs
        // defaultValue={config.AIEnabled ? config.Provider : 'random'}
        defaultValue={'random'}
        onValueChange={value => {
          switch (value) {
            case 'random':
              setValue('AIEnabled', false);
              setValue('Provider', '');
              setValue('Model', '');
              break;
            case 'gemini':
            case 'openai':
              setValue('AIEnabled', true);
              setValue('Provider', value);
              setValue(
                'Model',
                value === 'gemini'
                  ? DEFAULT_SUGGESTED_GEMINI_MODEL
                  : DEFAULT_SUGGESTED_OPENAI_MODEL
              );
              break;
          }
        }}
      >
        <TabsList className="m-auto">
          <TabsTrigger className="cursor-pointer" value="random">
            Random Snippets
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
              Generate text snippets using random words.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="gemini">
          <div className="space-y-4">
            <div className="flex gap-4 items-center align-center justify-center">
              <div>
                <Label htmlFor="gemini-model">Gemini Model</Label>

                <Input
                  id="gemini-model"
                  placeholder="e.g., gemini-2.5-flash"
                  {...register('Model', {
                    required: 'Model is required',
                  })}
                  className={cn({ 'border-red-500': errors.Model })}
                />
                <FieldError error={errors.Model} />
              </div>
              <div>
                <Label htmlFor="gemini-api-key">API key</Label>
                <Input
                  id="gemini-api-key"
                  placeholder="Enter your Gemini API key"
                  {...register('ApiKey', {
                    required: 'API key is required',
                  })}
                  className={cn({ 'border-red-500': errors.ApiKey })}
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

                <Input
                  id="openai-model"
                  placeholder="e.g., gpt-4o, gpt-3.5-turbo"
                  {...register('Model', {
                    required: 'Model is required',
                  })}
                  className={cn({ 'border-red-500': errors.Model })}
                />

                <FieldError error={errors.Model} />
              </div>
              <div>
                <Label htmlFor="openai-api-key">API key</Label>

                <Input
                  id="openai-api-key"
                  placeholder="Enter your OpenAI API key"
                  {...register('ApiKey', {
                    required: 'API key is required',
                  })}
                  className={cn({ 'border-red-500': errors.ApiKey })}
                />

                <FieldError error={errors.ApiKey} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      {AIEnabled ? (
        <>
          <div className="mt-4">
            <Label htmlFor="openai-prompt">Prompt Template</Label>
            <textarea
              className="w-full p-2 border rounded-md mt-2"
              placeholder="Enter your prompt template..."
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Available variables: $SnippetSize, $HighlightedText, $MinLines,
              $MaxLines, $Duration, $Width, $Height, $FPS, $Font
            </p>
          </div>
          <div className="mt-4">
            <Label>Preview (with current config values):</Label>
            <textarea
              readOnly
              {...register('Prompt')}
              className="p-3 bg-muted rounded-md text-sm w-full min-h-[100px]"
              value={parsedText}
            />
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Prompt;
