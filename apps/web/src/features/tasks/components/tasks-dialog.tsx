import { useState } from "react"
import { Play, Plus, Pencil, Trash2, ArrowLeft, Terminal } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Badge } from "@/shared/ui/badge"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
} from "@/shared/ui/input-group"
import { FieldError } from "@/shared/ui/field"
import { cn } from "@/shared/lib/utils"
import { useTasksStore } from "../store"
import type { WorkspaceTask } from "../types"

// ─── Task creation / edit form ─────────────────────────────────────────────

interface TaskFormProps {
  task: WorkspaceTask | null
  onSave: (data: Omit<WorkspaceTask, "id">) => void
  onCancel: () => void
}

function TaskForm({ task, onSave, onCancel }: TaskFormProps) {
  const [name, setName] = useState(task?.name ?? "")
  const [command, setCommand] = useState(task?.command ?? "")
  const [description, setDescription] = useState(task?.description ?? "")
  const [errors, setErrors] = useState<{ name?: string; command?: string }>({})

  const handleSave = () => {
    const e: { name?: string; command?: string } = {}
    if (!name.trim()) e.name = "Name is required"
    if (!command.trim()) e.command = "Command is required"
    if (Object.keys(e).length) {
      setErrors(e)
      return
    }
    onSave({
      name: name.trim(),
      command: command.trim(),
      description: description.trim() || undefined,
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave()
  }

  return (
    <div className="flex flex-col">
      {/* Back nav */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b px-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <span className="text-xs font-semibold">
          {task ? "Edit Task" : "New Task"}
        </span>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-4 px-4 py-5">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="task-name"
            className="text-xs font-medium text-foreground"
          >
            Name
          </label>
          <Input
            id="task-name"
            autoFocus
            placeholder="e.g. Dev server, Run tests, Build"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setErrors((p) => ({ ...p, name: undefined }))
            }}
            onKeyDown={handleKeyDown}
            aria-invalid={!!errors.name}
          />
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </div>

        {/* Command — terminal-style with $ prefix */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="task-command"
            className="text-xs font-medium text-foreground"
          >
            Command
          </label>
          <InputGroup aria-invalid={errors.command ? true : undefined}>
            <InputGroupAddon>
              <InputGroupText className="font-mono text-muted-foreground/60 select-none">
                $
              </InputGroupText>
            </InputGroupAddon>
            <InputGroupInput
              id="task-command"
              placeholder="npm run dev"
              value={command}
              onChange={(e) => {
                setCommand(e.target.value)
                setErrors((p) => ({ ...p, command: undefined }))
              }}
              onKeyDown={handleKeyDown}
              aria-invalid={!!errors.command}
              className="font-mono"
            />
          </InputGroup>
          {errors.command && <FieldError>{errors.command}</FieldError>}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="task-desc"
              className="text-xs font-medium text-foreground"
            >
              Description
            </label>
            <span className="text-[10px] text-muted-foreground/50">
              optional
            </span>
          </div>
          <Input
            id="task-desc"
            placeholder="Brief description of what this task does"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between border-t bg-muted/20 px-4 py-2.5">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex items-center gap-2.5">
          <span className="text-[10px] text-muted-foreground/40 select-none">
            ⌘↵
          </span>
          <Button size="sm" onClick={handleSave}>
            {task ? "Update task" : "Create task"}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Task row ──────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: WorkspaceTask
  disabled: boolean
  onEdit: () => void
  onDelete: () => void
  onRun: () => void
}

function TaskRow({ task, disabled, onEdit, onDelete, onRun }: TaskRowProps) {
  return (
    <div className="group flex items-center gap-2.5 border-b px-3 py-2.5 last:border-b-0 hover:bg-muted/30">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/60 text-muted-foreground transition-colors group-hover:bg-muted">
        <Terminal className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium leading-none text-foreground">
          {task.name}
        </p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <code className="shrink-0 font-mono text-[11px] leading-none text-muted-foreground">
            $ {task.command}
          </code>
          {task.description && (
            <>
              <span className="shrink-0 select-none text-[10px] text-muted-foreground/40">
                ·
              </span>
              <span className="min-w-0 truncate text-[11px] leading-none text-muted-foreground/60">
                {task.description}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-100 group-hover:opacity-100">
          <Button
            size="icon-sm"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground/60 hover:text-foreground"
            onClick={onEdit}
            title="Edit task"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground/60 hover:text-destructive"
            onClick={onDelete}
            title="Delete task"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        <Button
          size="sm"
          className={cn(
            "ml-1 h-6 gap-1 px-2.5 text-[11px] font-medium",
            disabled && "opacity-40"
          )}
          onClick={onRun}
          disabled={disabled}
        >
          <Play className="h-2.5 w-2.5 fill-current" />
          Run
        </Button>
      </div>
    </div>
  )
}

// ─── Main dialog ───────────────────────────────────────────────────────────

type Mode = { type: "list" } | { type: "form"; task: WorkspaceTask | null }

interface TasksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId?: string
  onRunTask: (command: string) => void
}

export function TasksDialog({
  open,
  onOpenChange,
  workspaceId = "",
  onRunTask,
}: TasksDialogProps) {
  const { getTasks, addTask, updateTask, deleteTask } = useTasksStore()
  const tasks = getTasks(workspaceId)

  const [mode, setMode] = useState<Mode>({ type: "list" })

  const openAdd = () => setMode({ type: "form", task: null })
  const openEdit = (task: WorkspaceTask) => setMode({ type: "form", task })
  const backToList = () => setMode({ type: "list" })

  const handleSave = (data: Omit<WorkspaceTask, "id">) => {
    if (mode.type === "form" && mode.task) {
      updateTask(workspaceId, mode.task.id, data)
    } else {
      addTask(workspaceId, data)
    }
    setMode({ type: "list" })
  }

  const handleRun = (task: WorkspaceTask) => {
    onRunTask(task.command)
    onOpenChange(false)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) setMode({ type: "list" })
    onOpenChange(next)
  }

  const editingTask = mode.type === "form" ? mode.task : null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className="flex flex-col gap-0 overflow-hidden p-0 sm:max-w-[480px]"
      >
        {/* Header */}
        <DialogHeader className="shrink-0 border-b px-4 pt-4 pb-3">
          <div className="flex items-center gap-2.5 pr-7">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border bg-primary/5">
              <Play className="h-3 w-3 text-primary" />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <DialogTitle className="text-sm font-semibold">Tasks</DialogTitle>
              {tasks.length > 0 && (
                <Badge
                  variant="outline"
                  className="h-4 px-1.5 font-mono text-[10px] tabular-nums"
                >
                  {tasks.length}
                </Badge>
              )}
            </div>
            {mode.type === "list" && (
              <Button
                size="sm"
                variant="outline"
                className="h-6 gap-1 px-2 text-[11px]"
                onClick={openAdd}
              >
                <Plus className="h-3 w-3" />
                New task
              </Button>
            )}
          </div>
          <DialogDescription className="mt-0.5 pl-[38px] text-[11px]">
            Run scripts and commands in the workspace terminal.
          </DialogDescription>
        </DialogHeader>

        {/* Body */}
        {mode.type === "list" ? (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30">
                  <Play className="h-5 w-5 text-muted-foreground/20" />
                </div>
                <div>
                  <p className="text-[13px] font-medium">No tasks yet</p>
                  <p className="mt-0.5 max-w-[240px] text-[11px] text-muted-foreground">
                    Add scripts to quickly run commands in the terminal.
                  </p>
                </div>
                <Button size="sm" onClick={openAdd}>
                  <Plus />
                  Add first task
                </Button>
              </div>
            ) : (
              <div>
                {tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    disabled={!workspaceId}
                    onEdit={() => openEdit(task)}
                    onDelete={() => deleteTask(workspaceId, task.id)}
                    onRun={() => handleRun(task)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <TaskForm
            key={editingTask?.id ?? "new"}
            task={editingTask}
            onSave={handleSave}
            onCancel={backToList}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
