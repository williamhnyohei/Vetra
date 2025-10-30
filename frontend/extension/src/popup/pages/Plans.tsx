import React, { useState } from 'react';
import { useLanguageStore } from '../../store/language-store';
import { t } from '../../i18n';
import ApiService from '../../services/api-service';

interface PlansProps {
  onBack?: () => void;
}

const Plans: React.FC<PlansProps> = ({ onBack }) => {
  const { language } = useLanguageStore();
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
            {t('plans.title', language)}
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
            {t('plans.free', language)}
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
            {t('plans.currentPlan', language)}
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
            {t('plans.price.free', language)}
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
            {t('plans.description.free', language)}
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
              {t('plans.features.basicRiskAnalysis', language)}
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
              {t('plans.features.sevenDayHistory', language)}
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
              {t('plans.features.tenInterceptionsPerDay', language)}
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
              {t('plans.features.evidenceTwoSources', language)}
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
              {t('plans.features.emailSupport', language)}
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
            {t('plans.recommended', language)}
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
            {t('plans.pro', language)}
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
            {t('plans.price.payAsYouGo', language)}
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
            {t('plans.description.pro', language)}
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
              {t('plans.features.advancedAnalysisAI', language)}
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
              {t('plans.features.unlimitedHistory', language)}
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
              {t('plans.features.unlimitedInterceptions', language)}
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
              {t('plans.features.evidenceMultipleSources', language)}
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
              {t('plans.features.transactionMemory', language)}
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
              {t('plans.features.automaticRules', language)}
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
              {t('plans.features.walletIntegration', language)}
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
              {t('plans.features.prioritySupport', language)}
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
          {upgradeSuccess ? t('plans.button.upgraded', language) : isUpgrading ? t('plans.button.upgrading', language) : t('plans.button.upgrade', language)}
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
          {t('plans.guarantee', language)}
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
            {t('plans.whyPro.title', language)}
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
            {t('plans.whyPro.description', language)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Plans;
