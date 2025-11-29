import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap, Box } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LandingPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const handleGetStarted = async () => {
        if (user) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-background to-background z-0" />

            <div className="z-10 text-center max-w-4xl px-4">
                <h1 className="text-6xl md:text-8xl font-bold mb-6 tracking-tighter">
                    <span className="text-gradient animate-pulse">{t('landing.title')}</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto">
                    {t('landing.subtitle')}
                </p>

                <button
                    onClick={handleGetStarted}
                    className="group relative px-8 py-4 bg-primary text-white text-lg font-bold rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        {user ? t('landing.cta_dashboard') : t('landing.cta_start')} <Zap className="w-5 h-5" />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-violet-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left">
                    <div className="glass-panel p-6 rounded-2xl hover:-translate-y-2 transition-transform duration-300">
                        <Sparkles className="w-10 h-10 text-accent mb-4" />
                        <h3 className="text-xl font-bold mb-2">{t('landing.feature_analysis')}</h3>
                        <p className="text-gray-400">{t('landing.feature_analysis_desc')}</p>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl hover:-translate-y-2 transition-transform duration-300 delay-100">
                        <Box className="w-10 h-10 text-primary mb-4" />
                        <h3 className="text-xl font-bold mb-2">{t('landing.feature_refine')}</h3>
                        <p className="text-gray-400">{t('landing.feature_refine_desc')}</p>
                    </div>
                    <div className="glass-panel p-6 rounded-2xl hover:-translate-y-2 transition-transform duration-300 delay-200">
                        <Zap className="w-10 h-10 text-secondary mb-4" />
                        <h3 className="text-xl font-bold mb-2">{t('landing.feature_assets')}</h3>
                        <p className="text-gray-400">{t('landing.feature_assets_desc')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;
