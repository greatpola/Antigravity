import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyzeImage, generateCharacter, createCheckoutSession } from '../lib/api';
import { Upload, Loader2, Wand2, LogOut, Coffee, Lock, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Dashboard: React.FC = () => {
    const { user, profile, refreshProfile, logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'upload' | 'analyzing' | 'refining' | 'done'>('upload');

    const [activeTab, setActiveTab] = useState('Basic');
    const [assets, setAssets] = useState<Record<string, string>>({});
    const [generatingAsset, setGeneratingAsset] = useState(false);

    // Real Premium Status
    const isPremium = profile?.isPremium || false;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleProcess = async () => {
        if (!file) return;
        if ((profile?.credits || 0) < 1) {
            alert("Insufficient credits! Please buy more coffee.");
            return;
        }

        setLoading(true);
        setStep('analyzing');
        setAssets({}); // Reset assets
        setActiveTab('Basic');

        try {
            // 1. Analyze
            const analysisResult = await analyzeImage(file);
            setAnalysis(analysisResult.description);
            const detectedStyle = analysisResult.style || "3D Render";

            setStep('refining');

            // 2. Generate (Basic)
            // Use the analysis description as the prompt
            const prompt = analysisResult.description;
            const generationResult = await generateCharacter(prompt, detectedStyle, "basic");

            setGeneratedImage(generationResult.image_url);
            setAssets(prev => ({ ...prev, Basic: generationResult.image_url }));
            setStep('done');

            // Refresh credits
            await refreshProfile();

        } catch (error: any) {
            console.error("Processing failed", error);
            if (error.response?.status === 402) {
                alert("Insufficient credits!");
            } else {
                alert("Something went wrong. Check console.");
            }
            setStep('upload');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = async (tab: string) => {
        const isLocked = tab !== 'Basic' && !isPremium;
        if (isLocked) return;

        setActiveTab(tab);

        // If asset already exists, don't regenerate
        if (assets[tab]) {
            setGeneratedImage(assets[tab]);
            return;
        }

        // Generate Asset
        setGeneratingAsset(true);
        try {
            // Use the stored analysis as the prompt
            const prompt = analysis || "A high quality 3D character";
            const result = await generateCharacter(prompt, "3D Render", tab.toLowerCase());
            setAssets(prev => ({ ...prev, [tab]: result.image_url }));
            setGeneratedImage(result.image_url);
        } catch (error) {
            console.error("Asset generation failed", error);
        } finally {
            setGeneratingAsset(false);
        }
    };

    const handleBuyCoffee = async () => {
        try {
            const { url } = await createCheckoutSession();
            window.location.href = url;
        } catch (error) {
            console.error("Checkout failed", error);
            alert("Failed to start checkout.");
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <header className="flex justify-between items-center mb-12">
                <h1 className="text-3xl font-bold text-gradient">{t('dashboard.title')}</h1>
                <div className="flex items-center gap-4">
                    <div className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="font-bold">{profile?.credits || 0} Credits</span>
                    </div>

                    {!isPremium && (
                        <button
                            onClick={handleBuyCoffee}
                            className="px-4 py-2 bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 rounded-full flex items-center gap-2 hover:bg-yellow-500/30 transition-colors"
                        >
                            <Coffee className="w-4 h-4" /> {t('dashboard.btn_buy_coffee')}
                        </button>
                    )}
                    <button onClick={() => navigate('/mypage')} className="hover:text-primary transition-colors">
                        {t('dashboard.welcome', { name: profile?.name || user?.displayName || 'User' })}
                    </button>
                    <button onClick={logout} className="p-2 hover:bg-white/10 rounded-full">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Left Panel: Input */}
                <div className="glass-panel p-8 rounded-3xl flex flex-col items-center justify-center min-h-[500px] border-dashed border-2 border-white/20 relative">
                    {preview ? (
                        <img src={preview} alt="Preview" className="max-h-[400px] rounded-xl object-contain mb-6" />
                    ) : (
                        <div className="text-center">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Upload className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-xl font-medium mb-2">{t('dashboard.upload_title')}</p>
                            <p className="text-gray-500 mb-6">{t('dashboard.upload_desc')}</p>
                        </div>
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={loading}
                    />

                    {file && !loading && step === 'upload' && (
                        <button
                            onClick={handleProcess}
                            className="z-10 px-8 py-3 bg-primary rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                            <Wand2 className="w-5 h-5" /> {t('dashboard.btn_ignite')}
                        </button>
                    )}

                    {loading && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-3xl z-20">
                            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                            <p className="text-xl font-bold animate-pulse">
                                {step === 'analyzing' ? t('dashboard.status_analyzing') : t('dashboard.status_refining')}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right Panel: Output */}
                <div className="glass-panel p-8 rounded-3xl flex flex-col min-h-[500px]">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <span className="w-2 h-8 bg-accent rounded-full" /> {t('dashboard.result_title')}
                    </h2>

                    {step === 'done' && generatedImage ? (
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 bg-black/20 rounded-xl overflow-hidden mb-6 relative group">
                                {generatingAsset ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                    </div>
                                ) : null}
                                <img src={generatedImage} alt="Generated" className="w-full h-full object-cover transition-opacity duration-300" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                    <p className="text-white/80 text-sm line-clamp-3">{analysis}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                                {['Basic', 'Story', 'Mockup', 'Emoji'].map((tab) => {
                                    const isLocked = tab !== 'Basic' && !isPremium;
                                    const isActive = activeTab === tab;
                                    const tabKey = `tab_${tab.toLowerCase()}`;
                                    return (
                                        <button
                                            key={tab}
                                            onClick={() => handleTabChange(tab)}
                                            className={`p-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors ${isLocked
                                                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                                : isActive
                                                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                                                    : 'bg-white/10 hover:bg-white/20 text-white'
                                                }`}
                                            disabled={isLocked}
                                        >
                                            {t(`dashboard.${tabKey}` as any)} {isLocked && <Lock className="w-3 h-3" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-600">
                            <p>{t('dashboard.awaiting_input')}</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
