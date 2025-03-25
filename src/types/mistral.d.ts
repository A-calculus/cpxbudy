import '@mistralai/mistralai';

declare module '@mistralai/mistralai' {
    interface ChatCompletionRequest {
        tools?: Array<{
            type: string;
            function: {
                name: string;
                description: string;
                parameters: {
                    type: string;
                    properties: Record<string, any>;
                    required: string[];
                };
            };
        }>;
        toolChoice?: string;
        parallelToolCalls?: boolean;
    }

    interface ChatCompletionMessage {
        role: string;
        content: string;
        toolCalls?: Array<{
            id: string;
            function: {
                name: string;
                arguments: string;
            };
        }>;
    }
} 