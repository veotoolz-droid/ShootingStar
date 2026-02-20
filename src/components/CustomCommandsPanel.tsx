import { useState } from 'react';
import { X, Plus, Trash2, Edit2, Check, X as XIcon, Terminal } from 'lucide-react';
import { useCustomCommands, CustomCommand } from '../hooks/useCustomCommands';
import { useToast } from '../hooks/useToast';

interface CustomCommandsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomCommandsPanel({ isOpen, onClose }: CustomCommandsPanelProps) {
  const { commands, addCommand, updateCommand, deleteCommand, resetToDefaults } = useCustomCommands();
  const { success } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CustomCommand>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [newCommand, setNewCommand] = useState({
    name: '',
    shortcut: '',
    prompt: '',
    description: '',
  });

  if (!isOpen) return null;

  const handleEdit = (cmd: CustomCommand) => {
    setEditingId(cmd.id);
    setEditForm(cmd);
  };

  const handleSave = () => {
    if (editingId && editForm.name && editForm.shortcut && editForm.prompt) {
      updateCommand(editingId, editForm);
      setEditingId(null);
      setEditForm({});
      success('Command updated!');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleAdd = () => {
    if (newCommand.name && newCommand.shortcut && newCommand.prompt) {
      addCommand({
        ...newCommand,
        shortcut: newCommand.shortcut.startsWith('/') ? newCommand.shortcut : `/${newCommand.shortcut}`,
      });
      setNewCommand({ name: '', shortcut: '', prompt: '', description: '' });
      setIsAdding(false);
      success('Command added!');
    }
  };

  const handleDelete = (id: string) => {
    deleteCommand(id);
    success('Command deleted!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[80vh] bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <Terminal className="w-5 h-5 text-violet-500" />
            Custom AI Commands
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-violet-500 text-white rounded-lg text-sm hover:bg-violet-600"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
            <button onClick={onClose} className="p-1 hover:bg-secondary rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Add new command form */}
          {isAdding && (
            <div className="p-4 bg-violet-500/5 border border-violet-500/20 rounded-lg space-y-3">
              <h4 className="font-medium text-sm">New Command</h4>
              <input
                type="text"
                value={newCommand.name}
                onChange={(e) => setNewCommand({ ...newCommand, name: e.target.value })}
                placeholder="Command name"
                className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none"
              />
              <input
                type="text"
                value={newCommand.shortcut}
                onChange={(e) => setNewCommand({ ...newCommand, shortcut: e.target.value })}
                placeholder="Shortcut (e.g., /custom)"
                className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none"
              />
              <textarea
                value={newCommand.prompt}
                onChange={(e) => setNewCommand({ ...newCommand, prompt: e.target.value })}
                placeholder="AI prompt template..."
                rows={3}
                className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none resize-none"
              />
              <input
                type="text"
                value={newCommand.description}
                onChange={(e) => setNewCommand({ ...newCommand, description: e.target.value })}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 bg-secondary rounded-lg text-sm outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  className="flex-1 px-3 py-2 bg-violet-500 text-white rounded-lg text-sm hover:bg-violet-600"
                >
                  Add Command
                </button>
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-2 bg-secondary rounded-lg text-sm hover:bg-secondary/80"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Commands list */}
          {commands.map((cmd) => (
            <div key={cmd.id} className="p-4 bg-secondary/30 rounded-lg">
              {editingId === cmd.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background rounded-lg text-sm outline-none"
                  />
                  <input
                    type="text"
                    value={editForm.shortcut || ''}
                    onChange={(e) => setEditForm({ ...editForm, shortcut: e.target.value })}
                    className="w-full px-3 py-2 bg-background rounded-lg text-sm outline-none"
                  />
                  <textarea
                    value={editForm.prompt || ''}
                    onChange={(e) => setEditForm({ ...editForm, prompt: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-background rounded-lg text-sm outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleSave} className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={handleCancel} className="p-1.5 bg-secondary rounded hover:bg-secondary/80">
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{cmd.name}</span>
                      <code className="px-2 py-0.5 bg-secondary rounded text-xs">{cmd.shortcut}</code>
                    </div>
                    {cmd.description && (
                      <p className="text-sm text-muted-foreground mt-1">{cmd.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{cmd.prompt}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => handleEdit(cmd)}
                      className="p-1.5 hover:bg-secondary rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(cmd.id)}
                      className="p-1.5 hover:bg-red-500/10 text-red-500 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-border bg-secondary/30">
          <button
            onClick={() => { resetToDefaults(); success('Reset to defaults!'); }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomCommandsPanel;
