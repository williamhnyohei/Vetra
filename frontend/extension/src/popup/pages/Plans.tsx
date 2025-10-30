import React, { useState } from 'react';
import ApiService from '../../services/api-service';

interface PlansProps {
  onBack?: () => void;
}

const Plans: React.FC<PlansProps> = ({ onBack }) => {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const apiService = ApiService.getInstance();
      const response = await apiService.upgradeToPro();
      
      if (response.success) {
        setUpgradeSuccess(true);
        console.log('✅ Upgraded to Pro:', response);
        
        // Show success message for 2 seconds then go back
        setTimeout(() => {
          if (onBack) onBack();
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Upgrade error:', error);
      alert('Failed to upgrade. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

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
              fontWeight: '400',
              fontSize: '18px',
              lineHeight: '24px',
              letterSpacing: '0px',
              color: '#E6E6E6'
            }}
          >
            Choose your plan
          </h1>
        </div>
      </div>

      {/* FREE Plan Card */}
      <div className="bg-dark-card rounded-lg p-4 relative">
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
            FREE
          </h2>
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
            Current plan
          </span>
        </div>
        
        <div className="mb-4">
          <p 
            style={{
              fontFamily: 'Arial',
              fontWeight: '700',
              fontSize: '24px',
              lineHeight: '32px',
              letterSpacing: '0px',
              color: '#E6E6E6'
            }}
          >
            $0
          </p>
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
            Basic protection to get started
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
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
              Basic risk analysis
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
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
              7-day history
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
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
              Up to 10 interceptions/day
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
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
              Evidence from 2 sources
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
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
              Email support
            </span>
          </div>
        </div>
      </div>

      {/* PRO Plan Card */}
      <div className="bg-dark-card rounded-lg p-4 relative border-2 border-yellow-500">
        <div className="absolute top-4 right-4">
          <div 
            className="px-3 py-1 rounded"
            style={{
              backgroundColor: '#FBB500',
              fontFamily: 'Arial',
              fontWeight: '700',
              fontSize: '12px',
              lineHeight: '16px',
              letterSpacing: '0px',
              color: '#1A141F'
            }}
          >
            RECOMMENDED
          </div>
        </div>
        
        <div className="mb-4">
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
            PRO
          </h2>
          <p 
            style={{
              fontFamily: 'Arial',
              fontWeight: '700',
              fontSize: '24px',
              lineHeight: '32px',
              letterSpacing: '0px',
              color: '#E6E6E6'
            }}
          >
            Pay as you go
          </p>
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
            Pay only for what you use (GPT 4.0/5.0)
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
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
              Advanced analysis with AI
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
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
              Unlimited history
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
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
              Unlimited interceptions
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
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
              Evidence from multiple sources
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
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
              Transaction memory
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
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
              Automatic rules
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
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
              Integration with Wallet *
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
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
              Priority support
            </span>
          </div>
        </div>

        <button 
          className="w-full rounded-lg py-3 mb-3"
          style={{
            backgroundColor: upgradeSuccess ? '#00D386' : '#FBB500',
            color: '#1A141F',
            fontFamily: 'Arial',
            fontWeight: '700',
            fontSize: '14px',
            lineHeight: '20px',
            letterSpacing: '0px',
            opacity: isUpgrading ? 0.7 : 1
          }}
          onClick={handleUpgrade}
          disabled={isUpgrading || upgradeSuccess}
        >
          {upgradeSuccess ? '✅ Upgraded!' : isUpgrading ? 'Upgrading...' : 'Upgrade to Pro'}
        </button>
        
        <p 
          style={{
            fontFamily: 'Arial',
            fontWeight: '400',
            fontSize: '12px',
            lineHeight: '16px',
            letterSpacing: '0px',
            color: '#858C94',
            textAlign: 'center'
          }}
        >
          30-day guarantee - Cancel anytime
        </p>
      </div>

      {/* Why choose Pro? Section */}
      <div className="flex items-start gap-3">
        <svg className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <div>
          <h3 
            style={{
              fontFamily: 'Arial',
              fontWeight: '400',
              fontSize: '16px',
              lineHeight: '20px',
              letterSpacing: '0px',
              color: '#E6E6E6',
              marginBottom: '8px'
            }}
          >
            Why choose Pro?
          </h3>
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
            With the Pro plan, you gain greater accuracy in analyses using cutting-edge AI models, memory of previous transactions for better pattern detection, and complete control with customized automatic rules.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Plans;
