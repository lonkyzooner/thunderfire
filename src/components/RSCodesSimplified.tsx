import React, { useState, useRef, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { getLegalInformation } from '../lib/openai-service';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
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
  
  // Default to the main statutes page
  return LA_REVISED_STATUTES_URL;
};

// Function to handle statute lookups with enhanced features
const handleStatuteLookup = async (
  statuteInput: string, 
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>, 
  setResult: React.Dispatch<React.SetStateAction<string>>, 
  setSuggestedCharges: React.Dispatch<React.SetStateAction<any[]>>, 
  speak: (text: string) => void, 
  resultRef: React.RefObject<HTMLDivElement>,
  setStatuteUrl?: React.Dispatch<React.SetStateAction<string | null>>
) => {
  if (!statuteInput.trim()) return;
  
  setIsLoading(true);
  setResult('');
  setSuggestedCharges([]);
  
  try {
    // Get the direct URL to the statute if possible
    const url = getStatuteUrl(statuteInput);
    if (setStatuteUrl) setStatuteUrl(url);
    
    // Get the legal information from the API
    const legalInfo = await getLegalInformation(statuteInput);
    setResult(legalInfo);
    
    // Scroll to the result
    if (resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (error) {
    console.error('Error looking up statute:', error);
    setResult('Error looking up statute. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

export function RSCodes() {
  const [statuteInput, setStatuteInput] = useState('');
  const [statuteUrl, setStatuteUrl] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredCodes, setFilteredCodes] = useState(commonCodes);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<"lookup" | "analyze">("lookup");
  const [situationInput, setSituationInput] = useState('');
  const [result, setResult] = useState('');
  const [suggestedCharges, setSuggestedCharges] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [additionalCharge, setAdditionalCharge] = useState('');
  const [additionalChargeResponse, setAdditionalChargeResponse] = useState('');
  const [recentSearchHistory, setRecentSearchHistory] = useState(recentSearches);
  
  // Speech recognition for voice input
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
    setIsSpeaking(true);
    liveKitVoiceService.speak(text, 'ash').finally(() => setIsSpeaking(false));
  };

  // Handle voice input for situation analysis
  const handleVoiceInput = () => {
    if (listening) {
      stopListening();
      if (transcript) {
        setSituationInput(transcript);
      }
    } else {
      setSituationInput('');
      startListening();
      
      // Auto-stop after 10 seconds if still listening
      setTimeout(() => {
        if (listening) {
          stopListening();
          if (transcript) {
            setSituationInput(transcript);
          }
        }
      }, 10000);
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
    setRecentSearchHistory(prev => [newSearch, ...prev.slice(0, 4)]);
  };
  
  // Handle statute lookup with LiveKit voice and URL tracking
  const lookupStatute = () => {
    if (!statuteInput.trim()) return;
    
    addToRecentSearches(statuteInput);
    handleStatuteLookup(
      statuteInput,
      setIsLoading,
      setResult,
      setSuggestedCharges,
      synthesizeSpeech,
      resultRef,
      setStatuteUrl
    );
  };

  // Process voice commands for statute lookup
  const processVoiceCommand = (command: string) => {
    setStatuteInput(command);
    lookupStatute();
  };

  const handleResult = (event: any) => {
    const last = event.results.length - 1;
    processVoiceCommand(event.results[last][0].transcript);
  };

  const handleSituationAnalysis = async () => {
    if (!situationInput.trim()) return;
    
    setIsLoading(true);
    setResult('');
    setSuggestedCharges([]);
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'LARK Statute Analysis'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro-exp-03-25:free',
          messages: [
            {
              role: 'system',
              content: `You are a Louisiana law enforcement assistant specializing in criminal statutes. 
              Analyze the given situation and suggest applicable Louisiana criminal charges.
              For each suggested charge, provide:
              1. The specific statute (e.g., "La. R.S. 14:65")
              2. The name of the charge (e.g., "Simple Robbery")
              3. A brief explanation of why this charge applies to the situation
              
              Format your response as JSON with the following structure:
              {
                "charges": [
                  {
                    "code": "La. R.S. 14:65",
                    "name": "Simple Robbery",
                    "reason": "The suspect took something of value from the victim using force or intimidation without a dangerous weapon."
                  }
                ],
                "summary": "A concise legal analysis of the situation"
              }
              
              Focus on Louisiana statutes only and be precise with statute references.`
            },
            {
              role: 'user',
              content: situationInput
            }
          ]
        })
      });
      
      const data = await response.json();
      const analysisText = data.choices?.[0]?.message?.content;
      
      if (analysisText) {
        try {
          // Try to parse as JSON
          const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || analysisText.match(/{[\s\S]*}/);
          const jsonStr = jsonMatch ? jsonMatch[0].replace(/```json\n|```/g, '') : analysisText;
          
          const parsedData = JSON.parse(jsonStr);
          
          if (parsedData.charges && Array.isArray(parsedData.charges)) {
            setSuggestedCharges(parsedData.charges);
          }
          
          setResult(parsedData.summary || analysisText);
        } catch (parseError) {
          console.error('Error parsing analysis result:', parseError);
          setResult(analysisText);
        }
      } else {
        setResult('No analysis could be generated. Please try again with more details.');
      }
    } catch (error) {
      console.error('Error analyzing situation:', error);
      setResult('Error analyzing situation. Please try again.');
    } finally {
      setIsLoading(false);
      
      // Scroll to the result
      if (resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleQuickCodeSelect = (code: string) => {
    setStatuteInput(code);
    setActiveTab("lookup");
    lookupStatute();
  };

  const handleAdditionalChargeSubmit = async () => {
    if (!additionalCharge.trim()) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'LARK Statute Analysis'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro-exp-03-25:free',
          messages: [
            {
              role: 'system',
              content: 'You are a Louisiana law enforcement assistant specializing in criminal statutes. Analyze the suggested charge and provide information about the relevant Louisiana statute.'
            },
            {
              role: 'user',
              content: `Provide information about the following potential charge in Louisiana: ${additionalCharge}`
            }
          ]
        })
      });
      
      const data = await response.json();
      setAdditionalChargeResponse(data.choices?.[0]?.message?.content || 'No information found for this charge.');
    } catch (error) {
      console.error('Error submitting additional charge:', error);
      setAdditionalChargeResponse('Error processing charge information. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopSpeaking = () => {
    liveKitVoiceService.stop();
    setIsSpeaking(false);
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

export default RSCodes;
