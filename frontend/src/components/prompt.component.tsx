import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import useAppContext from '@/store';
import { useState } from 'react';

const Prompt = () => {
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
        defaultValue="random"
        onValueChange={value => {
          setConfig(prevConfig => ({
            ...prevConfig,
            ...(value === 'gemini'
              ? {
                  AIEnabled: true,
                  Provider: 'gemini',
                  Model: 'gemini-1.5-flash',
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
                <Input
                  id="gemini-model"
                  placeholder="e.g., gemini-1.5-flash"
                  value={config?.Model || ''}
                  onChange={e =>
                    setConfig(prevConfig => ({
                      ...prevConfig,
                      Model: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="gemini-api-key">API key</Label>
                <Input
                  id="gemini-api-key"
                  placeholder="Enter your Gemini API key"
                  value={config?.ApiKey || ''}
                  onChange={e =>
                    setConfig(prevConfig => ({
                      ...prevConfig,
                      ApiKey: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="gemini-prompt">Prompt Template</Label>
              <textarea
                className="w-full p-2 border rounded-md mt-2"
                id="gemini-prompt"
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
          </div>
        </TabsContent>

        <TabsContent value="openai" className="w-fit">
          <div className="space-y-4">
            <div className="flex gap-4 items-center align-center justify-center">
              <div>
                <Label htmlFor="openai-model">OpenAI Model</Label>
                <Input
                  id="openai-model"
                  placeholder="e.g., gpt-4o, gpt-3.5-turbo"
                  value={config?.Model || ''}
                  onChange={e =>
                    setConfig(prevConfig => ({
                      ...prevConfig,
                      Model: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="openai-api-key">API key</Label>
                <Input
                  id="openai-api-key"
                  placeholder="Enter your OpenAI API key"
                  value={config?.ApiKey || ''}
                  onChange={e =>
                    setConfig(prevConfig => ({
                      ...prevConfig,
                      ApiKey: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div>
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Prompt;
