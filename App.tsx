import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration } from '@google/genai';
import { ArcReactor } from './components/ArcReactor';
import { ChatWidget, SystemPerformanceWidget, NetworkSpeedWidget } from './components/Widgets';
import { HudState, THEME_COLORS, ChatMessage } from './types';
import { decode, decodeAudioData, createPcmBlob } from './utils/audioUtils';

export default function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  // System State
  const [hudState, setHudState] = useState<HudState>({
    isListening: false,
    isConnected: false,
    themeColor: 'cyan',
    isDiagnosticRunning: false,
    isSystemLocked: false,
  });

  // Data States
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [volume, setVolume] = useState(0);

  // Refs for Audio
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Current turn transcription buffer
  const currentInputTransRef = useRef("");
  const currentOutputTransRef = useRef("");

  // API Key handling
  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio && await window.aistudio.hasSelectedApiKey()) {
        setApiKey(process.env.API_KEY || 'VALID'); 
        return;
      }
      if (process.env.API_KEY) {
        setApiKey(process.env.API_KEY);
      }
    };
    checkApiKey();
  }, []);

  const handleConnectApiKey = async () => {
     if (window.aistudio) {
        try {
            await window.aistudio.openSelectKey();
            setApiKey(process.env.API_KEY || 'assumed-valid'); 
        } catch (e) {
            console.error(e);
        }
     }
  };

  // Helper to add chat messages
  const addChatMessage = (sender: 'user' | 'jarvis', text: string) => {
    setChatHistory(prev => {
        return [...prev, { id: Math.random().toString(36).substring(7), sender, text }];
    });
  };

  // Tools Definition
  const functionDeclarations: FunctionDeclaration[] = [
    {
      name: 'setSystemTheme',
      description: 'Changes the interface color theme.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          color: { type: Type.STRING, enum: ['cyan', 'amber', 'red', 'green'], description: 'The color theme.' }
        },
        required: ['color']
      }
    },
    {
        name: 'runSystemDiagnostics',
        description: 'Run system diagnostics.',
        parameters: { 
            type: Type.OBJECT, 
            properties: { 
                mode: { type: Type.STRING, enum: ['full', 'quick'], description: 'Diagnostic mode' }
            } 
        }
    },
    {
        name: 'lockSystem',
        description: 'Lock system interface.',
        parameters: { 
            type: Type.OBJECT, 
            properties: {
                reason: { type: Type.STRING, description: 'Reason for locking' }
            }
        }
    },
    {
        name: 'unlockSystem',
        description: 'Unlock system interface.',
        parameters: { 
            type: Type.OBJECT, 
            properties: {
                code: { type: Type.STRING, description: 'Unlock code' }
            }
        }
    }
  ];

  // Main Live API Connection Logic
  const connectToJarvis = async () => {
    const keyToUse = apiKey || process.env.API_KEY;
    if (!keyToUse) {
        return;
    }
    
    const ai = new GoogleGenAI({ apiKey: keyToUse });
    
    // Audio Context Setup
    inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    // Gain Node for visualizer
    const analyser = outputAudioContextRef.current.createAnalyser();
    analyser.fftSize = 256;
    const outputGain = outputAudioContextRef.current.createGain();
    outputGain.connect(outputAudioContextRef.current.destination);
    outputGain.connect(analyser);

    // Visualizer Loop
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a,b) => a+b, 0) / dataArray.length;
        setVolume(avg / 128); 
        requestAnimationFrame(updateVolume);
    };
    updateVolume();

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                // Enable transcription
                inputAudioTranscription: {},
                outputAudioTranscription: {},
                systemInstruction: `You are J.A.R.V.I.S. Control this interface. Be concise.`,
                tools: [{ functionDeclarations, googleSearch: {} }]
            },
            callbacks: {
                onopen: () => {
                    setHudState(prev => ({ ...prev, isConnected: true, isListening: true }));
                    // Setup Input Streaming
                    if (!inputAudioContextRef.current) return;
                    const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                    const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                    scriptProcessor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmBlob = createPcmBlob(inputData);
                        sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContextRef.current.destination);
                },
                onmessage: async (msg: LiveServerMessage) => {
                    // Handle Transcription
                    if (msg.serverContent?.inputTranscription) {
                        currentInputTransRef.current += msg.serverContent.inputTranscription.text;
                    }
                    if (msg.serverContent?.outputTranscription) {
                        currentOutputTransRef.current += msg.serverContent.outputTranscription.text;
                    }

                    // Turn complete logic (commit transcriptions)
                    if (msg.serverContent?.turnComplete) {
                        if (currentInputTransRef.current.trim()) {
                            addChatMessage('user', currentInputTransRef.current);
                            currentInputTransRef.current = "";
                        }
                        if (currentOutputTransRef.current.trim()) {
                             addChatMessage('jarvis', currentOutputTransRef.current);
                             currentOutputTransRef.current = "";
                        }
                    }

                    // Handle Audio Output
                    const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioData && outputAudioContextRef.current) {
                         const ctx = outputAudioContextRef.current;
                         nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                         const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
                         const source = ctx.createBufferSource();
                         source.buffer = audioBuffer;
                         source.connect(outputGain);
                         source.start(nextStartTimeRef.current);
                         nextStartTimeRef.current += audioBuffer.duration;
                         sourcesRef.current.add(source);
                         source.addEventListener('ended', () => sourcesRef.current.delete(source));
                    }

                    // Handle Tool Calls
                    if (msg.toolCall) {
                        for (const fc of msg.toolCall.functionCalls) {
                            let result = { result: 'success' };
                            try {
                                if (fc.name === 'setSystemTheme') {
                                    const color = (fc.args as any).color;
                                    setHudState(prev => ({ ...prev, themeColor: color }));
                                } else if (fc.name === 'lockSystem') {
                                    setHudState(prev => ({ ...prev, isSystemLocked: true }));
                                } else if (fc.name === 'unlockSystem') {
                                    setHudState(prev => ({ ...prev, isSystemLocked: false }));
                                }
                            } catch (error) { result = { result: 'failed' }; }

                            sessionPromise.then(session => session.sendToolResponse({
                                functionResponses: { id: fc.id, name: fc.name, response: result }
                            }));
                        }
                    }
                },
                onclose: () => {
                    setHudState(prev => ({ ...prev, isConnected: false, isListening: false }));
                },
                onerror: (e) => {
                    console.error(e);
                }
            }
        });
    } catch (err) {
        console.error(err);
    }
  };

  const colors = THEME_COLORS[hudState.themeColor];

  // Simplified background gradient to prevent Tailwind class generation errors
  const bgGradientStyle = {
    background: `radial-gradient(circle at center, ${colors.hex}10 0%, transparent 70%)`
  };

  return (
    <div className="w-screen h-screen bg-[#050505] text-white overflow-hidden flex flex-col items-center justify-center relative font-[Rajdhani]">
      
      {/* Dynamic Background */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={bgGradientStyle}
      ></div>
      
      {/* Top Section: Listening Pill */}
      {hudState.isListening && (
        <div className="absolute top-12 z-20">
          <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-[#0a0a0a]/80 backdrop-blur-md border border-white/10 shadow-lg">
             <div className="flex items-center gap-1 h-3">
                <div className={`w-1 h-full ${colors.accent} animate-pulse`}></div>
                <div className={`w-1 h-2/3 ${colors.accent} animate-pulse delay-75`}></div>
                <div className={`w-1 h-full ${colors.accent} animate-pulse delay-150`}></div>
                <div className={`w-1 h-1/2 ${colors.accent} animate-pulse delay-300`}></div>
             </div>
             <span className="text-sm font-medium tracking-wide text-gray-300">Listening...</span>
          </div>
        </div>
      )}

      {/* Initialize Button (if not connected) */}
      {!hudState.isConnected && (
         <div className="absolute top-10 right-10 z-50">
             <button 
                onClick={() => !apiKey ? handleConnectApiKey() : connectToJarvis()}
                className={`px-6 py-2 rounded-lg border ${colors.border} bg-white/5 hover:bg-white/10 transition text-sm font-bold uppercase tracking-wider`}
             >
                {!apiKey ? 'Select API Key' : 'Connect JARVIS'}
             </button>
         </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col items-center justify-center w-full max-w-6xl px-8 z-10 gap-12">
          
          {/* Center: Hero Card / Mic Visualizer */}
          <div className="flex flex-col items-center">
             <ArcReactor theme={hudState.themeColor} isListening={hudState.isListening} volume={volume} />
             
             {/* Status Text */}
             <div className="mt-8 flex flex-col items-center gap-1">
                 <span className="text-2xl font-light tracking-widest text-white">JARVIS</span>
                 <span className={`text-xs uppercase tracking-[0.3em] ${hudState.isConnected ? 'text-green-500' : 'text-gray-600'}`}>
                    {hudState.isConnected ? 'Connected' : 'Offline'}
                 </span>
             </div>
          </div>

          {/* Bottom: Widgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <ChatWidget theme={hudState.themeColor} messages={chatHistory} />
              <SystemPerformanceWidget theme={hudState.themeColor} />
              <NetworkSpeedWidget theme={hudState.themeColor} />
          </div>

      </div>

      {/* Footer / Copyright */}
      <div className="absolute bottom-4 text-[10px] text-gray-700 uppercase tracking-widest">
         Aniket Visuals System /// Secure Uplink
      </div>

    </div>
  );
}