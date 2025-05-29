// DEBUG: Log OpenRouter API key at runtime (remove after testing)
console.log('[DEBUG] VITE_OPENROUTER_API_KEY:', import.meta.env.VITE_OPENROUTER_API_KEY);
import React, { useState, useRef, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { getLegalInformation } from '../lib/openai-service';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Loader2, Mic, StopCircle, Search, BookOpen, Scale, AlertTriangle, Volume2, Link2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useVoice } from '../contexts/VoiceContext';
import { liveKitVoiceService } from '../services/livekit/LiveKitVoiceService';

// Louisiana Revised Statutes reference URL
const LA_REVISED_STATUTES_URL = 'https://www.legis.la.gov/legis/Laws_Toc.aspx?folder=75';

// Statute categories for organized reference
const statuteCategories = [
  { id: 'RS14', name: 'Criminal Law', url: 'https://www.legis.la.gov/Legis/Law.aspx?d=78337' },
  { id: 'RS32', name: 'Motor Vehicles and Traffic', url: 'https://www.legis.la.gov/Legis/Law.aspx?d=88166' },
  { id: 'RS40', name: 'Public Health and Safety', url: 'https://www.legis.la.gov/Legis/Law.aspx?d=98856' },
  { id: 'RS15', name: 'Criminal Procedure', url: 'https://www.legis.la.gov/Legis/Law.aspx?d=78673' },
  { id: 'RS13', name: 'Courts and Judicial Procedure', url: 'https://www.legis.la.gov/Legis/Law.aspx?d=77990' },
];

// Sample data of common Louisiana criminal codes for quick reference
const commonCodes = [
  { code: 'La. R.S. 14:30', name: 'First Degree Murder', category: 'RS14' },
  { code: 'La. R.S. 14:31', name: 'Second Degree Murder', category: 'RS14' },
  { code: 'La. R.S. 14:34', name: 'Aggravated Battery', category: 'RS14' },
  { code: 'La. R.S. 14:65', name: 'Simple Robbery', category: 'RS14' },
  { code: 'La. R.S. 14:67', name: 'Theft', category: 'RS14' },
  { code: 'La. R.S. 14:42', name: 'Aggravated Rape', category: 'RS14' },
  { code: 'La. R.S. 40:966', name: 'Possession of Schedule I CDS', category: 'RS40' },
  { code: 'La. R.S. 14:108', name: 'Resisting an Officer', category: 'RS14' },
  { code: 'La. R.S. 14:63', name: 'Criminal Trespass', category: 'RS14' },
  { code: 'La. R.S. 14:98', name: 'DWI', category: 'RS14' },
  { code: 'La. R.S. 32:58', name: 'Careless Operation', category: 'RS32' },
  { code: 'La. R.S. 32:415', name: 'Driving Under Suspension', category: 'RS32' },
  { code: 'La. R.S. 15:571.11', name: 'Disposition of Fines', category: 'RS15' },
];

// Recent searches for quick access (would be persisted in a real app)
const recentSearches = [
  { query: 'La. R.S. 14:98', timestamp: new Date('2025-03-15T14:30:00') },
  { query: 'resisting arrest', timestamp: new Date('2025-03-16T09:15:00') },
  { query: 'traffic stop procedure', timestamp: new Date('2025-03-17T11:45:00') },
];

// Function to get the direct URL to a statute if possible
const getStatuteUrl = (statuteInput: string): string | null => {
  // Parse the statute input to extract title and section
  const match = statuteInput.match(/(?:La\. R\.S\.|RS) ?(\d+)(?::|\.)?(\d+)?/i);
  if (!match) return null;
  
  const title = match[1];
  const section = match[2];
  
  // If we have both title and section, construct a direct URL to the statute
  if (title && section) {
    return `https://www.legis.la.gov/Legis/Law.aspx?d=78${parseInt(title) * 100 + parseInt(section)}`;
  }
  
  // Return the base category URL if we can find it
  const category = statuteCategories.find(cat => cat.id === `RS${title}`);
  if (category) return category.url;
  
  // If it's a search term rather than a statute reference, use the search URL
  if (!match) {
    return `https://www.legis.la.gov/Legis/LawSearch.aspx?q=${encodeURIComponent(statuteInput)}`;
  }
  
  // Default to the main statutes page
  return LA_REVISED_STATUTES_URL;
};

// Function to handle statute lookups with enhanced features
export const handleStatuteLookup = async (
  statuteInput: string, 
  setIsLoading: Function, 
  setResult: Function, 
  setSuggestedCharges: Function, 
  speak: Function, 
  resultRef: React.RefObject<HTMLDivElement>,
  setStatuteUrl?: Function
) => {
  if (!statuteInput.trim()) return;
  
  setIsLoading(true);
  setResult('');
  setSuggestedCharges([]);
  
  try {
    // Get legal information from AI service
    const legalInfo = await getLegalInformation(statuteInput);
    setResult(legalInfo);
    
    // Get direct URL to statute if possible
    const url = getStatuteUrl(statuteInput);
    if (setStatuteUrl && url) setStatuteUrl(url);
    
    // Speak the result using TTS
    speak(`Information for statute ${statuteInput}: ${legalInfo}`);
    
    // Add to recent searches (would be implemented with local storage in a real app)
    // saveRecentSearch(statuteInput);
    
    // Scroll to result
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  } catch (error) {
    console.error("Error looking up statute:", error);
    setResult("Sorry, there was an error retrieving information for this statute.");
  } finally {
    setIsLoading(false);
  }
};

export function RSCodes() {
  const [statuteInput, setStatuteInput] = useState('');
  const [statuteUrl, setStatuteUrl] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredCodes, setFilteredCodes] = useState(commonCodes);
  const [recentStatuteSearches, setRecentStatuteSearches] = useState(recentSearches);
  const [situationInput, setSituationInput] = useState('');
  const [voiceInput, setVoiceInput] = useState('');
  const [activeTab, setActiveTab] = useState<'lookup' | 'analyze'>('analyze');
  const [result, setResult] = useState('');
  const [suggestedCharges, setSuggestedCharges] = useState<{code: string, name: string, reason: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  const [additionalCharge, setAdditionalCharge] = useState('');
  const [additionalChargeResponse, setAdditionalChargeResponse] = useState('');

  // Use VoiceContext for speech synthesis
  const { speak, isSpeaking, stopSpeaking } = useVoice();
  const { 
    transcript, 
    listening, 
    startListening, 
    stopListening,
    hasRecognitionSupport 
  } = useSpeechRecognition();
  
  const resultRef = useRef<HTMLDivElement>(null);

  // Function to handle voice synthesis - always use LiveKit voice service for consistent voice
  const synthesizeSpeech = (text: string) => {
    // Always use LiveKit voice service for consistent voice experience
    liveKitVoiceService.speak(text, 'ash');
  };

  // Handle voice input for situation analysis
  const handleVoiceInput = () => {
    if (listening) {
      stopListening();
      if (transcript) {
        setVoiceInput(transcript);
        setSituationInput(transcript);
        
        // If we have a transcript, analyze it or look up statutes based on content
        if (transcript.toLowerCase().includes('statute') || 
            transcript.toLowerCase().includes('code') || 
            transcript.toLowerCase().includes('r.s.')) {
          setActiveTab('lookup');
          setStatuteInput(transcript);
          setTimeout(() => lookupStatute(), 500);
        }
      }
    } else {
      setVoiceInput('');
      startListening();
    }
  };
  
  // Filter codes based on selected category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredCodes(commonCodes);
    } else {
      setFilteredCodes(commonCodes.filter(code => code.category === selectedCategory));
    }
  }, [selectedCategory]);
  
  // Add a statute to recent searches
  const addToRecentSearches = (query: string) => {
    const newSearch = { query, timestamp: new Date() };
    setRecentStatuteSearches(prev => [newSearch, ...prev.slice(0, 4)]); // Keep only 5 most recent
  };
  
  // Handle statute lookup with LiveKit voice and URL tracking
  const lookupStatute = async () => {
    await handleStatuteLookup(
      statuteInput,
      setIsLoading,
      setResult,
      setSuggestedCharges,
      synthesizeSpeech,
      resultRef,
      setStatuteUrl
    );
    addToRecentSearches(statuteInput);
  };



  const processVoiceCommand = async (command: string) => {
    await handleSituationAnalysis();
  };

  const handleResult = (event: SpeechRecognitionEvent) => {
    const transcript = event.results[event.resultIndex][0].transcript;
    processVoiceCommand(transcript);
  };

  const handleSituationAnalysis = async () => {
    const inputText = situationInput.trim();
    if (!inputText) return;
    
    setIsLoading(true);
    setResult('');
    setSuggestedCharges([]);
    
    try {
      const prompt = `
        As a legal assistant for Louisiana law enforcement, analyze ONLY the explicitly stated facts in this situation. Do not make assumptions or add details that are not directly mentioned:

        Situation: ${inputText}

        Instructions:
        1. Consider ONLY the facts explicitly stated above
        2. Do NOT make assumptions about additional circumstances or details
        3. Identify Louisiana statutes that may apply based SOLELY on the stated facts (up to 3 most relevant)
        4. For each statute, explain why it applies using ONLY the information provided

        Format your response as JSON:
        {
          "charges": [
            {
              "code": "La. R.S. XX:XX",
              "name": "Name of offense",
              "reason": "Brief explanation using only stated facts"
            }
          ],
          "summary": "Brief analysis based strictly on provided information"
        }

        Important: If certain details would be needed to determine if a statute applies, do not include that statute. Only include charges that can be supported by the explicitly stated facts.
      `;
      
      // Direct call to OpenRouter API for legal/statute analysis
      const openrouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY || "";
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:8080',
          'X-Title': 'LARK App'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4',
          messages: [
            { role: 'system', content: 'You are a professional legal assistant for Louisiana law enforcement. Respond in JSON as instructed.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 512
        })
      });
      let legalAnalysis = '';
      try {
        const data = await response.json();
        if (response.ok && data.choices && data.choices[0]?.message?.content) {
          legalAnalysis = data.choices[0].message.content.trim();
        } else {
          legalAnalysis = "An error occurred while retrieving statute information.";
        }
      } catch (err) {
        legalAnalysis = "An error occurred while retrieving statute information.";
      }
      
      try {
        // Try to parse JSON response
        const jsonStart = legalAnalysis.indexOf('{');
        const jsonEnd = legalAnalysis.lastIndexOf('}') + 1;
        
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonStr = legalAnalysis.substring(jsonStart, jsonEnd);
          const parsedResponse = JSON.parse(jsonStr);
          
          setSuggestedCharges(parsedResponse.charges || []);
          setResult(parsedResponse.summary || legalAnalysis);
          
          // Build a spoken summary of the charges
          let fullSummary = ''; // Initialize fullSummary properly
          if (parsedResponse.charges && parsedResponse.charges.length > 0) {
            parsedResponse.charges.forEach((charge: { code: string; name: string; reason: string }, index: number) => {
              fullSummary += `${charge.code}, ${charge.name}. ${charge.reason}. `;
              
              if (index < parsedResponse.charges.length - 1) {
                fullSummary += "Next, ";
              }
            });
            
            // Add the bottom summary if available
            if (parsedResponse.summary) {
              fullSummary += ` In conclusion, ${parsedResponse.summary}`;
            }
          } else {
            fullSummary += parsedResponse.summary || "No specific charges were identified.";
          }
          
          // Automatically speak the complete analysis results
          setTimeout(() => {
            liveKitVoiceService.speak(fullSummary, 'ash');
          }, 500);
        } else {
          // Handle non-JSON response gracefully
          console.warn("Received non-JSON response:", legalAnalysis);
          setResult(legalAnalysis);
          setTimeout(() => {
            liveKitVoiceService.speak(`Based on the information you provided, here's my analysis: ${legalAnalysis}`, 'ash');
          }, 500);
        }
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        setResult(legalAnalysis);
        setTimeout(() => {
          liveKitVoiceService.speak(`Based on the information you provided, here's my analysis: ${legalAnalysis}`, 'ash');
        }, 500);
      }
      
      // Scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error("Error analyzing situation:", error);
      setResult("Sorry, there was an error analyzing this situation.");
      liveKitVoiceService.speak("Sorry, there was an error analyzing this situation.", 'ash');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickCodeSelect = (code: string) => {
    setStatuteInput(code);
    setActiveTab('lookup');
    setTimeout(() => handleStatuteLookup(statuteInput, setIsLoading, setResult, setSuggestedCharges, synthesizeSpeech, resultRef, setStatuteUrl), 100);
  };

  const handleAdditionalChargeSubmit = async () => {
    if (additionalCharge.trim()) {
      // Process the additional charge suggestion
      const prompt = `Analyze the additional charge: ${additionalCharge}`;
      try {
        const analysis = await getLegalInformation(prompt);
        // Handle the analysis response
        console.log('Additional Charge Analysis:', analysis);
        setAdditionalChargeResponse(analysis);
        // Provide feedback to the user
        synthesizeSpeech(`You suggested the charge: ${additionalCharge}. Analysis: ${analysis}`);
      } catch (error) {
        console.error('Error processing additional charge:', error);
        setResult('Sorry, there was an error processing your additional charge.');
      }
      // Clear the input after processing
      setAdditionalCharge('');
    }
  };

  return (
    <div>
      <h2>Louisiana Criminal Code Analysis</h2>
      <Button onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}>
        {showAdditionalInfo ? "Hide Info" : "Show Common Codes"}
      </Button>

      {showAdditionalInfo && (
        <div>
          <p>Common Louisiana Criminal Codes:</p>
          <div>
            {commonCodes.map((code) => (
              <div key={code.code} onClick={() => handleQuickCodeSelect(code.code)}>
                {code.code} - {code.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "lookup" | "analyze")}
      >
        <TabsList>
          <TabsTrigger value="analyze">Analyze Situation</TabsTrigger>
          <TabsTrigger value="lookup">Lookup Statute</TabsTrigger>
        </TabsList>

        <TabsContent value="lookup">
          <div>
            <label>Enter Louisiana Statute Reference</label>
            <div>
              <Input
                value={statuteInput}
                onChange={(e) => setStatuteInput(e.target.value)}
                placeholder="e.g., 'La. R.S. 14:30' or '14:30'"
              />
              <Button
                onClick={() =>
                  handleStatuteLookup(
                    statuteInput,
                    setIsLoading,
                    setResult,
                    setSuggestedCharges,
                    synthesizeSpeech,
                    resultRef,
                    setStatuteUrl
                  )
                }
                disabled={!statuteInput.trim() || isLoading}
              >
                {isLoading ? "Loading..." : "Lookup"}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analyze">
          <div>
            <label>Describe the situation</label>
            {hasRecognitionSupport && (
              <Button onClick={handleVoiceInput}>
                {listening ? "Stop" : "Voice Input"}
              </Button>
            )}
            <Textarea
              value={situationInput}
              onChange={(e) => setSituationInput(e.target.value)}
              placeholder="E.g.: Subject was observed taking merchandise valued at $75 from a store without paying and concealing it in their backpack..."
            />
            <Button
              onClick={handleSituationAnalysis}
              disabled={!situationInput.trim() || isLoading}
            >
              {isLoading ? "Analyzing..." : "Analyze & Suggest Charges"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {isLoading && <div>Analyzing Louisiana statutes...</div>}

      {(result || suggestedCharges.length > 0) && !isLoading && (
        <div ref={resultRef}>
          <h2>Analysis Result</h2>
          {isSpeaking ? (
            <Button onClick={stopSpeaking}>Stop Audio</Button>
          ) : (
            result && (
              <Button
                onClick={() => {
                  let fullSummary = "";
                  if (suggestedCharges.length > 0) {
                    suggestedCharges.forEach((charge, index) => {
                      fullSummary += `${charge.code}, ${charge.name}. ${charge.reason}. `;
                      if (index < suggestedCharges.length - 1) {
                        fullSummary += "Next, ";
                      }
                    });
                    
                    if (result) {
                      fullSummary += ` In conclusion, ${result}`;
                    }
                  } else if (result) {
                    fullSummary += result;
                  }
                  
                  synthesizeSpeech(fullSummary);
                }}
              >
                Read Result
              </Button>
            )
          )}  
          </div>
          
          {suggestedCharges.length > 0 && (
            <div>
              {suggestedCharges.map((charge, index) => (
                <div key={index} onClick={() => handleQuickCodeSelect(charge.code)}>
                  <div>
                    {charge.code} - {charge.name}
                  </div>
                  <p>{charge.reason}</p>
                </div>
              ))}
            </div>
          )}
          
          {result && <div>{result}</div>}
            
          {activeTab === 'analyze' && suggestedCharges.length > 0 && (
            <div>Note: Click on any charge above to lookup its full statutory details</div>
          )}
          
          <div>
            <Textarea
              placeholder="Suggest an additional charge..."
              value={additionalCharge}
              onChange={(e) => setAdditionalCharge(e.target.value)}
            />
            <Button onClick={handleAdditionalChargeSubmit}>Submit Charge</Button>
            {additionalChargeResponse && <div>{additionalChargeResponse}</div>}
          </div>
          
          <div>
            <span>Powered by LiveKit AI</span>
            {statuteUrl && (
              <a href={statuteUrl} target="_blank" rel="noopener noreferrer">
                View Official Statute
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}