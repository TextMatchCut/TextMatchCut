export namespace types {
	
	export class Config {
	    Width: number;
	    Height: number;
	    FPS: number;
	    Duration: number;
	    HighlightedText: string;
	    HighlightColor: number[];
	    TextColor: number[];
	    BackgroundColor: number[];
	    BlurType: string;
	    BlurRadius: number;
	    BlurAngle: number;
	    FontSize: number;
	    MinLines: number;
	    MaxLines: number;
	    VerticalSpread: number;
	    OutputPath: string;
	    FontDir: string;
	    AIEnabled: boolean;
	    Verbose: boolean;
	    SoundEffectPath: string;
	    Feather: number;
	    Sfx: string;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Width = source["Width"];
	        this.Height = source["Height"];
	        this.FPS = source["FPS"];
	        this.Duration = source["Duration"];
	        this.HighlightedText = source["HighlightedText"];
	        this.HighlightColor = source["HighlightColor"];
	        this.TextColor = source["TextColor"];
	        this.BackgroundColor = source["BackgroundColor"];
	        this.BlurType = source["BlurType"];
	        this.BlurRadius = source["BlurRadius"];
	        this.BlurAngle = source["BlurAngle"];
	        this.FontSize = source["FontSize"];
	        this.MinLines = source["MinLines"];
	        this.MaxLines = source["MaxLines"];
	        this.VerticalSpread = source["VerticalSpread"];
	        this.OutputPath = source["OutputPath"];
	        this.FontDir = source["FontDir"];
	        this.AIEnabled = source["AIEnabled"];
	        this.Verbose = source["Verbose"];
	        this.SoundEffectPath = source["SoundEffectPath"];
	        this.Feather = source["Feather"];
	        this.Sfx = source["Sfx"];
	    }
	}
	export class GetDefaultAssetsPathResponse {
	    success: boolean;
	    error?: string;
	    path?: string;
	
	    static createFrom(source: any = {}) {
	        return new GetDefaultAssetsPathResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.error = source["error"];
	        this.path = source["path"];
	    }
	}
	export class PickAudioFileResponse {
	    success: boolean;
	    error?: string;
	    audioData?: string;
	    path?: string;
	
	    static createFrom(source: any = {}) {
	        return new PickAudioFileResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.error = source["error"];
	        this.audioData = source["audioData"];
	        this.path = source["path"];
	    }
	}
	export class RenderPreviewResponse {
	    success: boolean;
	    error?: string;
	    frameData?: string;
	
	    static createFrom(source: any = {}) {
	        return new RenderPreviewResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.error = source["error"];
	        this.frameData = source["frameData"];
	    }
	}
	export class RunResponse {
	    success: boolean;
	    error?: string;
	    videoData?: string;
	
	    static createFrom(source: any = {}) {
	        return new RunResponse(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.success = source["success"];
	        this.error = source["error"];
	        this.videoData = source["videoData"];
	    }
	}
	export class ToastConfig {
	    message: string;
	    type: string;
	    title: string;
	
	    static createFrom(source: any = {}) {
	        return new ToastConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.message = source["message"];
	        this.type = source["type"];
	        this.title = source["title"];
	    }
	}

}

