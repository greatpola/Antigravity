import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { analyzeImage, generateCharacter, createCheckoutSession } from '../lib/api';
import { Loader2, Wand2, Coffee, Zap, Download, RefreshCw, Image as ImageIcon } from 'lucide-react';

const STYLE_TAGS = [
    "3D Render", "Anime", "Pixel Art", "Watercolor", "Cyberpunk",
    "Oil Painting", "Sketch", "Flat Design", "Realistic", "Cartoon"
];

const Dashboard: React.FC = () => {
    const { profile, refreshProfile } = useAuth();

    // State
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Usage Limits Display
    const genCount = profile?.generation_count || 0;
    const modCount = profile?.modification_count || 0;
    const isPremium = profile?.isPremium || false;
    const credits = profile?.credits || 0;

    // Handle Image Upload & Analysis
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsAnalyzing(true);
            try {
                const result = await analyzeImage(file);
                setPrompt(result.description);
                if (result.style) setSelectedStyle(result.style);
            } catch (error) {
                console.error("Analysis failed", error);
                alert("Failed to analyze image.");
            } finally {
                setIsAnalyzing(false);
            }
        }
    };

    // Handle Generation
    const handleGenerate = async () => {
        if (!prompt) return;

        // Check Limits (Frontend Check)
        if (!isPremium && genCount >= 1 && credits < 1) {
            alert("You have used your free generation. Please buy credits!");
            return;
        }

        setLoading(true);
        try {
            const style = selectedStyle || "3D Render";
            const result = await generateCharacter(prompt, style, "basic");
            setGeneratedImage(result.image_url);
            await refreshProfile(); // Update counts
        } catch (error: any) {
            console.error("Generation failed", error);
            if (error.response?.status === 402) {
                alert("Insufficient credits!");
            } else {
                alert("Generation failed. Please try again.");
            }
        } finally {
            setLoading(false);
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

    // Modification State
    const [isModifyModalOpen, setIsModifyModalOpen] = useState(false);
    const [modificationPrompt, setModificationPrompt] = useState('');
    const [modifying, setModifying] = useState(false);

    // Handle Modification
    const handleModify = async () => {
        if (!modificationPrompt) return;

        // Check Limits
        if (!isPremium && modCount >= 1 && credits < 1) {
            alert("You have used your free modification. Please buy credits!");
            return;
        }

        setModifying(true);
        try {
            // We need a dummy project ID for now since we aren't tracking project history in frontend state perfectly yet
            // In a real app, we'd pass the actual project ID of the current image
            const dummyProjectId = "current-session-project";
            const result = await import('../lib/api').then(m => m.modifyCharacter(dummyProjectId, modificationPrompt));
            setGeneratedImage(result.image_url);
            await refreshProfile();
            setIsModifyModalOpen(false);
            setModificationPrompt('');
        } catch (error: any) {
            console.error("Modification failed", error);
            if (error.response?.status === 402) {
                alert("Insufficient credits!");
            } else {
                alert("Modification failed. Please try again.");
            }
        } finally {
            setModifying(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] text-gray-900 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">A</div>
                    <span className="font-bold text-xl tracking-tight">Antigravity</span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Credits Badge */}
                    <div className="hidden md:flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium text-gray-600">
                        <Zap className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span>{credits} Credits</span>
                    </div>

                    {!isPremium && (
                        <button
                            onClick={handleBuyCoffee}
                            className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-sm font-bold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all"
                        >
                            <Coffee className="w-4 h-4" /> Support Dev
                        </button>
                    )}

                    <div className="h-8 w-8 bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                        {/* User Avatar Placeholder */}
                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-xs">
                            {profile?.name?.[0] || "U"}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">

                {/* Input Section */}
                <section className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-4 text-primary font-bold">
                        <Wand2 className="w-5 h-5" />
                        <h2>What character shall we make?</h2>
                    </div>

                    <div className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ex: A playful rabbit in a blue hoodie, 3D render style..."
                            className="w-full h-32 md:h-40 bg-gray-50 border border-gray-200 rounded-2xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg placeholder:text-gray-400"
                            disabled={loading || isAnalyzing}
                        />

                        {/* Image Upload Button inside Textarea */}
                        <div className="absolute bottom-4 left-4">
                            <label className="cursor-pointer flex items-center gap-2 text-gray-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-gray-100">
                                <ImageIcon className="w-5 h-5" />
                                <span className="text-sm font-medium hidden md:inline">Analyze Image</span>
                                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" disabled={loading || isAnalyzing} />
                            </label>
                        </div>

                        {/* Generate Button */}
                        <div className="absolute bottom-4 right-4">
                            <button
                                onClick={handleGenerate}
                                disabled={loading || isAnalyzing || !prompt}
                                className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                {loading || isAnalyzing ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Generate <Wand2 className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Style Tags */}
                    <div className="mt-6 flex flex-wrap gap-2">
                        {STYLE_TAGS.map(style => (
                            <button
                                key={style}
                                onClick={() => setSelectedStyle(style)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${selectedStyle === style
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-transparent"
                                    }`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Usage Info Banner */}
                <section className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-500">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-indigo-900">Credits are used for generation.</h3>
                            <p className="text-sm text-indigo-700">Free: {1 - genCount > 0 ? 1 - genCount : 0} Gen left / {1 - modCount > 0 ? 1 - modCount : 0} Mod left</p>
                        </div>
                    </div>
                    {!isPremium && (
                        <button onClick={handleBuyCoffee} className="px-5 py-2 bg-white text-indigo-600 font-bold rounded-xl border border-indigo-200 shadow-sm hover:bg-indigo-50 transition-colors text-sm">
                            Support Developer
                        </button>
                    )}
                </section>

                {/* Result Area */}
                <section className="min-h-[400px] border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center bg-gray-50/50 relative overflow-hidden">
                    {generatedImage ? (
                        <div className="relative w-full h-full min-h-[400px] group">
                            <img src={generatedImage} alt="Generated Result" className="w-full h-full object-contain max-h-[600px]" />

                            {/* Overlay Actions */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                                <a
                                    href={generatedImage}
                                    download="antigravity-character.png"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-4 bg-white rounded-full text-gray-900 hover:scale-110 transition-transform shadow-xl"
                                    title="Download"
                                >
                                    <Download className="w-6 h-6" />
                                </a>
                                <button
                                    onClick={() => setIsModifyModalOpen(true)}
                                    className="p-4 bg-white rounded-full text-gray-900 hover:scale-110 transition-transform shadow-xl"
                                    title="Modify"
                                >
                                    <RefreshCw className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ImageIcon className="w-8 h-8 opacity-50" />
                            </div>
                            <p>Enter a description and press Generate</p>
                        </div>
                    )}
                </section>

            </main>

            {/* Modification Modal */}
            {isModifyModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-primary" />
                            Modify Character
                        </h3>
                        <p className="text-gray-500 mb-4 text-sm">
                            Describe how you want to change the character (e.g., "Make the hoodie red", "Add sunglasses").
                        </p>
                        <textarea
                            value={modificationPrompt}
                            onChange={(e) => setModificationPrompt(e.target.value)}
                            placeholder="Enter modification details..."
                            className="w-full h-32 bg-gray-50 border border-gray-200 rounded-xl p-4 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary mb-4"
                            disabled={modifying}
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsModifyModalOpen(false)}
                                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                                disabled={modifying}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleModify}
                                disabled={modifying || !modificationPrompt}
                                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary/20 flex items-center gap-2"
                            >
                                {modifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
