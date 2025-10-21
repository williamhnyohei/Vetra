import React, { useState } from 'react';

interface SettingsProps {
  onBack?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [shareInsights, setShareInsights] = useState(true);
  const [transactionMemory, setTransactionMemory] = useState(false);
  const [smartContractFingerprints, setSmartContractFingerprints] = useState(false);
  const [aiRigidity, setAiRigidity] = useState(65);

  return (
    <div className="w-full h-full bg-dark-bg text-dark-text p-4 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            className="p-2 text-gray-400 hover:text-white"
            onClick={onBack}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 
            style={{
              fontFamily: 'Arial',
              fontWeight: '700',
              fontSize: '18px',
              lineHeight: '24px',
              letterSpacing: '0px',
              color: '#E6E6E6'
            }}
          >
            Settings
          </h1>
        </div>
      </div>

      {/* Account Information Card */}
      <div className="bg-dark-card rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 
            style={{
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '16px',
              lineHeight: '20px',
              letterSpacing: '0px',
              color: '#E6E6E6'
            }}
          >
            Account
          </h2>
          <div 
            className="px-3 py-1 rounded-full"
            style={{
              backgroundColor: '#1E1E1E',
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0px',
              color: '#FFFFFF'
            }}
          >
            Free
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <p 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '14px',
                lineHeight: '20px',
                letterSpacing: '0px',
                color: '#E6E6E6'
              }}
            >
              Fulaninho da Silva
            </p>
            <p 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '14px',
                lineHeight: '20px',
                letterSpacing: '0px',
                color: '#858C94'
              }}
            >
              silva.fulano@example.com
            </p>
          </div>
          
          <div>
            <p 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '14px',
                lineHeight: '20px',
                letterSpacing: '0px',
                color: '#E6E6E6'
              }}
            >
              Connected Wallet
            </p>
            <p 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '14px',
                lineHeight: '20px',
                letterSpacing: '0px',
                color: '#858C94'
              }}
            >
              0x742d35Cc6634C0532925a3b8D5c3Cf6...Ba3e
            </p>
          </div>
        </div>
      </div>

      {/* Preferences and AI Personalization Card */}
      <div className="bg-dark-card rounded-lg p-4">
        {/* Preferences Section */}
        <div className="mb-6">
          <h3 
            style={{
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '16px',
              lineHeight: '20px',
              letterSpacing: '0px',
              color: '#E6E6E6',
              marginBottom: '16px'
            }}
          >
            Preferences
          </h3>
          
          <div className="space-y-4">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div>
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    color: '#E6E6E6'
                  }}
                >
                  Theme
                </p>
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0px',
                    color: '#858C94'
                  }}
                >
                  Choose between light, dark, or automatic
                </p>
              </div>
              <select 
                className="bg-dark-bg border border-dark-border rounded px-3 py-2"
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#E6E6E6'
                }}
              >
                <option>Automatic</option>
              </select>
            </div>

            {/* Sound Alerts */}
            <div className="flex items-center justify-between">
              <div>
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    color: '#E6E6E6'
                  }}
                >
                  Sound Alerts
                </p>
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0px',
                    color: '#858C94'
                  }}
                >
                  Play sound when detecting risky transactions
                </p>
              </div>
              <button
                className={`w-12 h-6 rounded-full transition-colors ${
                  soundAlerts ? 'bg-yellow-500' : 'bg-gray-600'
                }`}
                onClick={() => setSoundAlerts(!soundAlerts)}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    soundAlerts ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between">
              <div>
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    color: '#E6E6E6'
                  }}
                >
                  Language
                </p>
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0px',
                    color: '#858C94'
                  }}
                >
                  Interface Language
                </p>
              </div>
              <select 
                className="bg-dark-bg border border-dark-border rounded px-3 py-2"
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#E6E6E6'
                }}
              >
                <option>Portuguese (Bl</option>
              </select>
            </div>
          </div>
        </div>

        {/* AI Personalization Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '16px',
                lineHeight: '20px',
                letterSpacing: '0px',
                color: '#E6E6E6'
              }}
            >
              AI Personalization
            </h3>
            <span 
              style={{
                fontFamily: 'Arial',
                fontWeight: '400',
                fontSize: '12px',
                lineHeight: '16px',
                letterSpacing: '0px',
                color: '#FBB500'
              }}
            >
              Pro Feature
            </span>
          </div>
          
          <div className="space-y-4">
            {/* AI Rigidity */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    color: '#E6E6E6'
                  }}
                >
                  AI Rigidity
                </p>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span 
                    style={{
                      fontFamily: 'Arial',
                      fontWeight: '400',
                      fontSize: '12px',
                      lineHeight: '16px',
                      letterSpacing: '0px',
                      color: '#858C94'
                    }}
                  >
                    More Conservative
                  </span>
                  <span 
                    style={{
                      fontFamily: 'Arial',
                      fontWeight: '400',
                      fontSize: '14px',
                      lineHeight: '20px',
                      letterSpacing: '0px',
                      color: '#E6E6E6'
                    }}
                  >
                    {aiRigidity}%
                  </span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={aiRigidity}
                  onChange={(e) => setAiRigidity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #FBB500 0%, #FBB500 ${aiRigidity}%, #374151 ${aiRigidity}%, #374151 100%)`
                  }}
                />
                
                <div className="text-right">
                  <span 
                    style={{
                      fontFamily: 'Arial',
                      fontWeight: '400',
                      fontSize: '12px',
                      lineHeight: '16px',
                      letterSpacing: '0px',
                      color: '#858C94'
                    }}
                  >
                    More Permissive
                  </span>
                </div>
              </div>
            </div>

            {/* AI Language */}
            <div className="flex items-center justify-between">
              <div>
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    color: '#E6E6E6'
                  }}
                >
                  AI Language
                </p>
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0px',
                    color: '#858C94'
                  }}
                >
                  AI Language
                </p>
              </div>
              <select 
                className="bg-dark-bg border border-dark-border rounded px-3 py-2"
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#E6E6E6'
                }}
              >
                <option>Portuguese (Bl</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Data & Feature Settings Card */}
      <div className="bg-dark-card rounded-lg p-4">
        <div className="space-y-4">
          {/* Share insights */}
          <div className="flex items-center justify-between">
            <div>
              <p 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#E6E6E6'
                }}
              >
                Share insights (anonymous)
              </p>
              <p 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '12px',
                  lineHeight: '16px',
                  letterSpacing: '0px',
                  color: '#858C94'
                }}
              >
                Helps improve Vetra by sharing anonymized analysis data
              </p>
            </div>
            <button
              className={`w-12 h-6 rounded-full transition-colors ${
                shareInsights ? 'bg-yellow-500' : 'bg-gray-600'
              }`}
              onClick={() => setShareInsights(!shareInsights)}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  shareInsights ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Transaction Memory */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '14px',
                    lineHeight: '20px',
                    letterSpacing: '0px',
                    color: '#E6E6E6'
                  }}
                >
                  Transaction Memory
                </p>
                <span 
                  style={{
                    fontFamily: 'Arial',
                    fontWeight: '400',
                    fontSize: '12px',
                    lineHeight: '16px',
                    letterSpacing: '0px',
                    color: '#FBB500'
                  }}
                >
                  Pro Feature
                </span>
              </div>
              <p 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '12px',
                  lineHeight: '16px',
                  letterSpacing: '0px',
                  color: '#858C94'
                }}
              >
                Allows AI to learn from your previous transactions
              </p>
            </div>
            <button
              className={`w-12 h-6 rounded-full transition-colors ${
                transactionMemory ? 'bg-yellow-500' : 'bg-gray-600'
              }`}
              onClick={() => setTransactionMemory(!transactionMemory)}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  transactionMemory ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Smart Contract fingerprints */}
          <div className="flex items-center justify-between">
            <div>
              <p 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '14px',
                  lineHeight: '20px',
                  letterSpacing: '0px',
                  color: '#E6E6E6'
                }}
              >
                Smart Contract fingerprints
              </p>
              <p 
                style={{
                  fontFamily: 'Arial',
                  fontWeight: '400',
                  fontSize: '12px',
                  lineHeight: '16px',
                  letterSpacing: '0px',
                  color: '#858C94'
                }}
              >
                Save contract signatures for quick verification
              </p>
            </div>
            <button
              className={`w-12 h-6 rounded-full transition-colors ${
                smartContractFingerprints ? 'bg-yellow-500' : 'bg-gray-600'
              }`}
              onClick={() => setSmartContractFingerprints(!smartContractFingerprints)}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  smartContractFingerprints ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button 
          className="flex-1 rounded-lg flex items-center justify-center gap-2 transition-colors"
          style={{
            backgroundColor: '#E91E63',
            color: '#FFFFFF',
            fontFamily: 'Arial',
            fontWeight: '400',
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0px',
            height: '3rem',
            paddingLeft: '16px',
            paddingRight: '16px'
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
          </svg>
          Disconnect Wallet
        </button>
        <button 
          className="flex-1 rounded-lg flex items-center justify-center gap-2 transition-colors"
          style={{
            backgroundColor: '#1E1E1E',
            color: '#FFFFFF',
            fontFamily: 'Arial',
            fontWeight: '400',
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0px',
            height: '3rem',
            paddingLeft: '16px',
            paddingRight: '16px'
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Log out of account
        </button>
      </div>

      {/* Footer Disclaimer */}
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p 
          style={{
            fontFamily: 'Arial',
            fontWeight: '400',
            fontSize: '12px',
            lineHeight: '16px',
            letterSpacing: '0px',
            color: '#858C94'
          }}
        >
          Your private keys remain secure. Vetra never solicits or stores your credentials.
        </p>
      </div>
    </div>
  );
};

export default Settings;