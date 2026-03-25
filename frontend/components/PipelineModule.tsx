
import React, { useState, useMemo, useEffect } from 'react';
import { PipelineTask, PipelineStage, Severity, Project } from '../types';
import GlassCard from './GlassCard';
import Modal from './Modal';
import { 
  Plus, Clock, MoreHorizontal, 
  Grab, Info, Briefcase, Hash, 
  AlignLeft, Search, ChevronDown, 
  Layers, Filter, Calendar, Trash2, Edit2
} from 'lucide-react';
import CustomSelect from './CustomSelect';
import api from './api/AxiosInstance';

const STAGES: PipelineStage[] = ['To Do', 'In Progress', 'In Review', 'Completed'];

const SEVERITY_OPTIONS = [
  { value: 'Low', label: 'Tier 4 - Low' },
  { value: 'Medium', label: 'Tier 3 - Medium' },
  { value: 'High', label: 'Tier 2 - High' },
  { value: 'Critical', label: 'Tier 1 - Critical' },
];

const SeverityBadge = ({ severity }: { severity: Severity }) => {
  const styles = {
    Critical: 'bg-rose-50 text-rose-600 border-rose-100',
    High: 'bg-amber-50 text-amber-600 border-amber-100',
    Medium: 'bg-blue-50 text-blue-600 border-blue-100',
    Low: 'bg-slate-50 text-slate-500 border-slate-100',
  };
  return (
    <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-widest border ${styles[severity]}`}>
      {severity}
    </span>
  );
};

interface PipelineModuleProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  tasks: PipelineTask[];
  setTasks: React.Dispatch<React.SetStateAction<PipelineTask[]>>;
  addAuditEntry: (action: string, details: string) => void;
}

const PipelineModule: React.FC<PipelineModuleProps> = ({ projects, setProjects, tasks, setTasks, addAuditEntry }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [activeProjectIdForTask, setActiveProjectIdForTask] = useState<string | null>(null);
  
  const [editingTask, setEditingTask] = useState<PipelineTask | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null); // format: "projectId-stage"
  
  const [newTask, setNewTask] = useState<Partial<PipelineTask>>({
    title: '', description: '', severity: 'Medium', stage: 'To Do', startDate: '', dueDate: ''
  });

  const [newProject, setNewProject] = useState<Partial<Project>>({
    name: '', key: '', description: '', startDate: '', endDate: ''
  });
  const [dataFetched, setDataFetched] = useState(false);

  const filteredProjects = useMemo(() => 
    (projects || []).filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.key.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [projects, searchQuery]
  );

  const moveTask = async (taskId: string, projectId: string, targetStage: PipelineStage) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const oldStage = task.stage;
    if (oldStage === targetStage) return;

    try {
      await api.put(`/pipeline/update-task/${taskId}/${projectId}`, { ...task, stage: targetStage });
      console.log('Task stage updated successfully.');
    } catch (error) {
      console.error('Failed to update task stage:', error);
      alert('There was an error moving the remediation card. Please try again.');
      return;      
    }

    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, stage: targetStage } : t
    ));
    addAuditEntry('Move Remediation', `Moved remediation card ${taskId} from ${oldStage} to ${targetStage} in project ${task.projectId}`);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, projectId: string, stage: PipelineStage) => {
    e.preventDefault();
    setHoveredStageId(`${projectId}-${stage}`);
  };

  const handleDrop = (e: React.DragEvent, projectId: string, stage: PipelineStage) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    
    if (task && task.projectId === projectId) {
      moveTask(taskId, projectId, stage);
    }
    setDraggedTaskId(null);
    setHoveredStageId(null);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      try {
        const payload = {
          title: newTask.title,
          description: newTask.description,
          severity: newTask.severity,
          stage: newTask.stage,
          startDate: newTask.startDate,
          dueDate: newTask.dueDate
        };
        await api.put(`/pipeline/update-task/${editingTask.id}/${editingTask.projectId}`, payload);
        console.log('Task updated successfully.');
      } catch (error) {
        console.error('Failed to update task:', error);
        alert('There was an error updating the remediation card. Please try again.');
        return;
      }
      setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...newTask } : t));
      addAuditEntry('Update Remediation', `Modified card attributes for ${editingTask.id}: ${newTask.title}`);
    } else {
      if (!activeProjectIdForTask) return;
      const project = projects.find(p => p.id === activeProjectIdForTask);
      const task: PipelineTask = {
        ...newTask as PipelineTask,
        id: `${project?.key}-${Math.floor(Math.random() * 900) + 100}`,
        projectId: activeProjectIdForTask,
        owner: 'Alex Rivera',
        progress: 0,
        stage: STAGES[0],
        startDate: newTask.startDate || new Date().toISOString().split('T')[0],
        dueDate: newTask.dueDate || new Date(Date.now() + 604800000).toISOString().split('T')[0]
      };
      try {
        const payload = {
          id: task.id,
          projectId: task.projectId,
          title: task.title,
          description: task.description,
          severity: task.severity,
          stage: task.stage,
          owner: task.owner,
          progress: task.progress,
          startDate: task.startDate,
          dueDate: task.dueDate
        };
        await api.post("/pipeline/create-task", payload);
        console.log('Task created successfully.');
      } catch (error) {
        console.error('Failed to create task:', error);
        alert('There was an error creating the remediation card. Please try again.');
        return;        
      }
      setTasks([...tasks, task]);
      addAuditEntry('Create Remediation', `Initialized card ${task.id} in pipeline ${project?.id}`);
    }
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setNewTask({ title: '', description: '', severity: 'Medium', stage: 'To Do', startDate: '', dueDate: '' });
  };

  const handleDeleteTask = async (taskId: string, projectId: string) => {
    if (confirm('Delete this remediation card permanently?')) {
      try {
        await api.delete(`/pipeline/delete-task/${taskId}/${projectId}`);
        console.log('Task deleted successfully.');
      } catch (error) {
        console.error('Failed to delete task:', error);
        alert('There was an error deleting the remediation card. Please try again.');
        return;        
      }
      setTasks(prev => prev.filter(t => t.id !== taskId));
      addAuditEntry('Delete Remediation', `Purged card ${taskId} from pipeline`);
    }
  };

  const handleEditTask = (task: PipelineTask) => {
    setEditingTask(task);
    setNewTask(task);
    setIsTaskModalOpen(true);
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      const payload = {
        name: newProject.name,
        key: editingProject.key, // Key is immutable after creation
        description: newProject.description,
        owner: editingProject.owner,
        startDate: newProject.startDate,
        endDate: newProject.endDate
      };
      try {
        await api.put(`/pipeline/update-project/${editingProject.id}`, payload);
        console.log('Project updated successfully.');
      } catch (error) {
        console.error('Failed to update project:', error);
        alert('There was an error updating the project. Please try again.');
        return;
      }
      setProjects(prev => prev.map(p => p.id === editingProject.id ? { ...p, ...newProject } : p));
      addAuditEntry('Update Pipeline', `Modified registry pipeline metadata for ${editingProject.id}`);
    } else {
      const project: Project = {
        ...newProject as Project,
        id: `PROJ-${Math.floor(Math.random() * 9000) + 1000}`,
        owner: 'Alex Rivera',
        createdAt: new Date().toISOString().split('T')[0],
        startDate: newProject.startDate || new Date().toISOString().split('T')[0],
        endDate: newProject.endDate || new Date(Date.now() + 31536000000).toISOString().split('T')[0]
      };

      const payload = {
        id: project.id,
        name: project.name,
        key: project.key,
        description: project.description,
        owner: project.owner,
        startDate: project.startDate,
        endDate: project.endDate
      }

      try {
        await api.post("/pipeline/create-project", payload);
        console.log('Project created successfully.');
      } catch (error) {
        console.error('Failed to create project:', error);
        alert('There was an error creating the project. Please try again.');
        return;
      }

      setProjects([...projects, project]);
      addAuditEntry('Create Pipeline', `Initialized new governance pipeline: ${project.id} - ${project.name}`);
    }
    setIsProjectModalOpen(false);
    setEditingProject(null);
    setNewProject({ name: '', key: '', description: '', startDate: '', endDate: '' });
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setNewProject(project);
    setIsProjectModalOpen(true);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Delete this pipeline and all associated cards? This cannot be undone.')) {
      try {
        await api.delete(`/pipeline/delete-project/${projectId}`);
        console.log('Project deleted successfully.');
      } catch (error) {
        console.error('Failed to delete project:', error);
        alert('There was an error deleting the project. Please try again.');
        return;        
      }
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setTasks(prev => prev.filter(t => t.projectId !== projectId));
      addAuditEntry('Delete Pipeline', `Terminated governance pipeline ${projectId} and purged associated remediation history`);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projectsRes = await api.get("/pipeline/get-projects");
        const tasksRes = await api.get("/pipeline/get-tasks");
        setProjects(projectsRes.data);
        setTasks(tasksRes.data);
      } catch (error) {
        console.error('Failed to fetch pipeline data:', error);
      } finally {
        setDataFetched(true);
      }
    };
    fetchData();
  }, []);

  if (!dataFetched) return null;

  return (
    <div className="space-y-12 pb-32 overflow-y-auto no-scrollbar h-[calc(100vh-140px)]">
      {/* Module Navigation & Summary */}
      <div className="flex flex-col gap-6 pb-6 border-b border-slate-100 sticky top-0 bg-[#f8fafc]/80 backdrop-blur-xl z-[40]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-light text-slate-900 tracking-tight">Pipeline Registry</h1>
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-[0.15em]">Multi-Project Governance & Lifecycle</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input 
                type="text"
                placeholder="Filter pipelines..."
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-400 w-64 shadow-sm font-light"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => {
                setEditingProject(null);
                setNewProject({ name: '', key: '', description: '', startDate: '', endDate: '' });
                setIsProjectModalOpen(true);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-100"
            >
              <Plus size={16} /> New Pipeline
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Rows (Swimlanes) */}
      <div className="space-y-16">
        {filteredProjects.length > 0 ? filteredProjects.map((project) => (
          <div key={project.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Project Swimlane Header */}
            <div className="flex items-center justify-between mb-6 group/header px-2">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 font-bold text-[11px] shadow-sm group-hover/header:border-blue-400 transition-colors">
                  {project.key}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 tracking-tight group-hover/header:text-blue-600 transition-colors">{project.name}</h2>
                  <div className="flex items-center gap-4 mt-0.5">
                    <p className="text-[11px] text-slate-400 font-medium max-w-md truncate italic">{project.description}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                       <Calendar size={10} className="text-blue-500" /> {project.startDate.split("T")[0]} → {project.endDate.split("T")[0]}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-6 mr-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <Layers size={12} className="text-blue-500" />
                    <span>{tasks.filter(t => t.projectId === project.id).length} Active Cards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={12} className="text-amber-500" />
                    <span>{project.owner}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setActiveProjectIdForTask(project.id);
                      setEditingTask(null);
                      setNewTask({ title: '', description: '', severity: 'Medium', stage: 'To Do', startDate: '', dueDate: '' });
                      setIsTaskModalOpen(true);
                    }}
                    className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-xl transition-all hover:shadow-md"
                    title="Add Task to this Project"
                  >
                    <Plus size={18} />
                  </button>
                  <button 
                    onClick={() => handleEditProject(project)}
                    className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200 rounded-xl transition-all hover:shadow-md"
                    title="Edit Project"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-xl transition-all hover:shadow-md"
                    title="Delete Project"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Project Kanban Board (Horizontal Lane) */}
            <div className="overflow-x-auto custom-scrollbar pb-6 rounded-[2rem]">
              <div className="flex gap-6 min-w-max pr-6">
                {STAGES.map((stage) => {
                  const stageTasks = tasks.filter(t => t.projectId === project.id && t.stage === stage);
                  const isHovered = hoveredStageId === `${project.id}-${stage}`;

                  return (
                    <div 
                      key={stage} 
                      onDragOver={(e) => handleDragOver(e, project.id, stage)}
                      onDragLeave={() => setHoveredStageId(null)}
                      onDrop={(e) => handleDrop(e, project.id, stage)}
                      className={`w-72 flex flex-col h-full rounded-[2rem] transition-all duration-300 min-h-[300px] ${
                        isHovered ? 'bg-blue-50/50 ring-2 ring-blue-100 ring-dashed' : 'bg-slate-50/20 border border-slate-200/40'
                      }`}
                    >
                      <div className="p-4 flex items-center justify-between sticky top-0 bg-transparent z-10">
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{stage}</h3>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold transition-all ${
                            stageTasks.length > 0 ? 'bg-white border border-slate-200 text-slate-600 shadow-sm' : 'bg-transparent text-slate-300'
                          }`}>
                            {stageTasks.length}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 p-3 space-y-3 pb-8">
                        {stageTasks.map((task) => (
                          <div 
                            key={task.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            onDragEnd={() => {
                              setDraggedTaskId(null);
                              setHoveredStageId(null);
                            }}
                            className={`group bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-300 relative cursor-grab active:cursor-grabbing ${
                              draggedTaskId === task.id ? 'opacity-30 scale-95 border-blue-400 shadow-inner' : 'opacity-100'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-2">
                                <SeverityBadge severity={task.severity} />
                                <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest font-mono">{task.id}</span>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditTask(task)} className="p-1 text-slate-400 hover:text-blue-600 transition-colors">
                                  <Edit2 size={12} />
                                </button>
                                <button onClick={() => handleDeleteTask(task.id, task.projectId)} className="p-1 text-slate-400 hover:text-rose-600 transition-colors">
                                  <Trash2 size={12} />
                                </button>
                                <Grab size={12} className="text-slate-200" />
                              </div>
                            </div>
                            
                            <h4 className="text-[12px] font-semibold text-slate-800 mb-1 leading-snug group-hover:text-blue-600 transition-colors">
                              {task.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 line-clamp-2 mb-4 font-light leading-relaxed">
                              {task.description}
                            </p>

                            <div className="flex flex-col gap-2 pt-2 border-t border-slate-50">
                              <div className="flex items-center justify-between text-[9px] text-slate-400">
                                <div className="flex items-center gap-1 font-medium">
                                  <Calendar size={10} />
                                  <span className="truncate">{task.startDate.split('T')[0] || 'No Start'} → {task.dueDate.split('T')[0]}</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 bg-slate-50 px-1.5 py-0.5 rounded-lg border border-slate-100">
                                   <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-200">
                                      <img src={`https://picsum.photos/seed/${task.owner}/24/24`} alt="" />
                                   </div>
                                   <span className="text-[9px] text-slate-500 font-bold">{task.owner.split(' ')[0]}</span>
                                </div>
                                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                                  {task.progress}% Done
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        {stageTasks.length === 0 && (
                          <div className="h-20 border-2 border-dashed border-slate-200/50 rounded-2xl flex items-center justify-center text-slate-300 text-[9px] font-bold tracking-[0.3em] uppercase bg-white/20 group-hover:bg-white/40 transition-all">
                            Backlog
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )) : (
          <div className="flex flex-col items-center justify-center py-32 text-center glass rounded-[3rem] bg-white">
            <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mb-8">
              <Briefcase size={40} strokeWidth={1.5} />
            </div>
            <h3 className="text-xl font-light text-slate-900 mb-3">No Pipelines Found</h3>
            <p className="text-slate-400 max-w-xs mx-auto text-[13px] font-light leading-relaxed">
              Your search didn't return any results. Try adjusting your filters or initialize a new registry pipeline.
            </p>
            <button 
              onClick={() => setIsProjectModalOpen(true)}
              className="mt-10 px-10 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100"
            >
              Initialize Pipeline
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Project Modal */}
      <Modal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} title={editingProject ? `Edit Registry: ${editingProject.key}` : "Initialize Registry Project"}>
        <form onSubmit={handleAddProject} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Project Name</label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input 
                required
                type="text" 
                className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-blue-400 font-light"
                value={newProject.name}
                onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                placeholder="e.g. SOC2 Surveillance Audit"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Project Key</label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
              <input 
                required
                type="text" 
                maxLength={5}
                disabled={!!editingProject}
                className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-blue-400 uppercase font-mono disabled:opacity-50"
                value={newProject.key}
                onChange={(e) => setNewProject({...newProject, key: e.target.value.toUpperCase()})}
                placeholder="e.g. SOC2"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  type="date" 
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 font-light"
                  value={newProject.startDate}
                  onChange={(e) => setNewProject({...newProject, startDate: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  type="date" 
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 font-light"
                  value={newProject.endDate}
                  onChange={(e) => setNewProject({...newProject, endDate: e.target.value})}
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Strategic Objective</label>
            <div className="relative">
              <AlignLeft className="absolute left-4 top-4 text-slate-300" size={14} />
              <textarea 
                className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-4 text-sm text-slate-900 h-24 focus:outline-none focus:border-blue-400 resize-none font-light"
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                placeholder="Narrative summary..."
              />
            </div>
          </div>
          <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl mt-4 shadow-md tracking-[0.2em] uppercase text-[10px]">
            {editingProject ? 'Commit Project Changes' : 'Confirm Project Deployment'}
          </button>
        </form>
      </Modal>

      {/* Create/Edit Card Modal */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title={editingTask ? `Edit Remediation: ${editingTask.id}` : `New Remediation Card`}>
        <form onSubmit={handleAddTask} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Card Title</label>
            <input 
              required
              type="text" 
              className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3.5 text-sm text-slate-900 focus:outline-none focus:border-blue-400 font-light"
              value={newTask.title}
              onChange={(e) => setNewTask({...newTask, title: e.target.value})}
              placeholder="Primary corrective action..."
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Description</label>
            <textarea 
              className="w-full bg-white border border-slate-200 rounded-xl px-5 py-4 text-sm text-slate-900 h-32 focus:outline-none focus:border-blue-400 resize-none font-light"
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              placeholder="Technical steps or evidence requirements..."
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  type="date" 
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 font-light"
                  value={newTask.startDate}
                  onChange={(e) => setNewTask({...newTask, startDate: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">End Date (Due)</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input 
                  type="date" 
                  className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-5 py-3.5 text-[13px] text-slate-900 focus:outline-none focus:border-blue-400 font-light"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                />
              </div>
            </div>
          </div>

          <CustomSelect 
            label="Exposure Priority"
            options={SEVERITY_OPTIONS}
            value={newTask.severity || 'Medium'}
            onChange={(val) => setNewTask({...newTask, severity: val as Severity})}
          />
          <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl mt-4 shadow-md shadow-blue-100 tracking-[0.2em] uppercase text-[10px]">
            {editingTask ? 'Apply Changes' : 'Commit to Lifecycle'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default PipelineModule;
