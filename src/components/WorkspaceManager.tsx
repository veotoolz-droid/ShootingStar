import { useState } from 'react';
import { X, Save, FolderOpen, Trash2, Edit2, Check, X as XIcon, LayoutGrid } from 'lucide-react';
import { useWorkspaces, Workspace } from '../hooks/useWorkspaces';
import { Tab } from './TabManager';
import { useToast } from '../hooks/useToast';

interface WorkspaceManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTabs: Tab[];
  activeTabId: string;
  onLoadWorkspace: (workspace: Workspace) => void;
}

export function WorkspaceManager({ isOpen, onClose, currentTabs, activeTabId, onLoadWorkspace }: WorkspaceManagerProps) {
  const { workspaces, createWorkspace, deleteWorkspace, renameWorkspace } = useWorkspaces();
  const { success } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (workspaceName.trim()) {
      createWorkspace(workspaceName, currentTabs, activeTabId);
      setWorkspaceName('');
      setIsSaving(false);
      success('Workspace saved!');
    }
  };

  const handleLoad = (workspace: Workspace) => {
    onLoadWorkspace(workspace);
    onClose();
    success(`Loaded workspace: ${workspace.name}`);
  };

  const handleDelete = (id: string) => {
    deleteWorkspace(id);
    success('Workspace deleted!');
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameWorkspace(id, editName);
      setEditingId(null);
      setEditName('');
      success('Workspace renamed!');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-violet-500" />
            Workspaces
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Save current workspace */}
          <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-lg">
            {isSaving ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Workspace name..."
                  autoFocus
                  className="flex-1 px-3 py-2 bg-background rounded-lg text-sm outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSave();
                    if (e.key === 'Escape') setIsSaving(false);
                  }}
                />
                <button onClick={handleSave} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                  <Check className="w-4 h-4" />
                </button>
                <button onClick={() => setIsSaving(false)} className="p-2 bg-secondary rounded-lg hover:bg-secondary/80">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsSaving(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-500 text-white rounded-lg font-medium hover:bg-violet-600"
              >
                <Save className="w-4 h-4" />
                Save Current Workspace
              </button>
            )}
          </div>

          {/* Workspaces list */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Saved Workspaces ({workspaces.length})
            </h4>

            {workspaces.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No saved workspaces yet</p>
                <p className="text-sm mt-1">Save your current tabs to create a workspace</p>
              </div>
            ) : (
              workspaces.map((workspace) => (
                <div
                  key={workspace.id}
                  className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-violet-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {editingId === workspace.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                          className="flex-1 px-2 py-1 bg-background rounded text-sm outline-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(workspace.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button onClick={() => handleRename(workspace.id)} className="p-1 bg-green-500 text-white rounded">
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium truncate">{workspace.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {workspace.tabs.length} tabs • {formatDate(workspace.updatedAt)}
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleLoad(workspace)}
                      className="p-2 hover:bg-violet-500/10 text-violet-500 rounded-lg"
                      title="Load workspace"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setEditingId(workspace.id); setEditName(workspace.name); }}
                      className="p-2 hover:bg-secondary rounded-lg"
                      title="Rename"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(workspace.id)}
                      className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkspaceManager;
