import React, { useEffect, useState } from 'react';
import { getProjects } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, ArrowLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Project {
    id: string;
    prompt: string;
    image_url: string;
    style: string;
    createdAt: string;
}

const MyPage: React.FC = () => {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await getProjects();
                setProjects(data.projects);
            } catch (error) {
                console.error("Failed to fetch projects", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const handleDownload = async (imageUrl: string, filename: string) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Download failed", error);
            window.open(imageUrl, '_blank');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <header className="flex justify-between items-center mb-12">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-3xl font-bold text-gradient">{t('dashboard.title')} - History</h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-gray-400">{user?.displayName}</span>
                    <button onClick={logout} className="p-2 hover:bg-white/10 rounded-full">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto">
                {loading ? (
                    <div className="text-center py-20">Loading...</div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        No projects found. Start creating!
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => setSelectedProject(project)}
                                className="glass-panel rounded-2xl overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer"
                            >
                                <div className="aspect-square relative">
                                    <img src={project.image_url} alt={project.prompt} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                        <p className="text-white font-medium line-clamp-2">{project.prompt}</p>
                                        <span className="text-xs text-gray-300 mt-2 bg-white/20 px-2 py-1 rounded-full w-fit">
                                            {project.style}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4 flex items-center gap-2 text-gray-400 text-sm">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(project.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Detail Modal */}
            {selectedProject && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedProject(null)}>
                    <div className="glass-panel max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-3xl p-6 flex flex-col md:flex-row gap-8" onClick={e => e.stopPropagation()}>
                        <div className="flex-1">
                            <img src={selectedProject.image_url} alt="Full View" className="w-full rounded-xl" />
                        </div>
                        <div className="flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-2xl font-bold">Project Details</h2>
                                <button onClick={() => setSelectedProject(null)} className="p-2 hover:bg-white/10 rounded-full">
                                    <span className="text-2xl">&times;</span>
                                </button>
                            </div>

                            <div className="space-y-6 flex-1">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 mb-2">PROMPT</h3>
                                    <p className="bg-white/5 p-4 rounded-xl">{selectedProject.prompt}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 mb-2">STYLE</h3>
                                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
                                        {selectedProject.style}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 mb-2">CREATED</h3>
                                    <p>{new Date(selectedProject.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleDownload(selectedProject.image_url, `antigravity-${selectedProject.id}.png`)}
                                className="mt-8 w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                Download Image
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyPage;
