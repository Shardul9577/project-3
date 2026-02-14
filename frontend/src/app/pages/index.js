"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { TOKEN_STORAGE_KEY } from "../components/axios";

export default function IndexPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Generate modal (step 1)
  const [generateOpen, setGenerateOpen] = useState(false);
  const [goal, setGoal] = useState("");
  const [users, setUsers] = useState("");
  const [constraints, setConstraints] = useState("");
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateError, setGenerateError] = useState("");

  // Create task modal (step 2) - after generate success
  const [createOpen, setCreateOpen] = useState(false);
  const [generatedTaskList, setGeneratedTaskList] = useState([]);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Update modal
  const [updateTask, setUpdateTask] = useState(null);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateDescription, setUpdateDescription] = useState("");
  const [updateTaskList, setUpdateTaskList] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");

  // Delete confirm modal
  const [deleteConfirmTask, setDeleteConfirmTask] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }
    fetchTasks();
  }, [router]);

  const fetchTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/tasks");
      if (data.success && Array.isArray(data.tasks)) {
        setTasks(data.tasks);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load tasks.");
      if (err.response?.status === 401) router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = searchQuery.trim()
    ? tasks.filter((t) =>
        (t.title || "").toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : tasks;

  const openGenerateModal = () => {
    setGoal("");
    setUsers("");
    setConstraints("");
    setGenerateError("");
    setGenerateOpen(true);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerateLoading(true);
    setGenerateError("");
    try {
      // Call AI generation API only – no static data; backend uses OpenRouter/AI when configured
      const res = await api.post("/tasks/generate", {
        goal,
        users,
        constraints,
        endUsers: users, // backend accepts either
      });
      const data = res.data;
      // Backend returns the generated array directly on success, or { success: false, message } on error
      if (data?.success === false) {
        setGenerateError(data.message || "Generation failed.");
        return;
      }
      const list = Array.isArray(data) ? data : [];
      if (list.length > 0) {
        setGeneratedTaskList(list);
        setCreateTitle("");
        setCreateDescription("");
        setCreateError("");
        setGenerateOpen(false);
        setCreateOpen(true);
      } else {
        setGenerateError("No task list generated. Try again.");
      }
    } catch (err) {
      setGenerateError(
        err.response?.data?.message || err.message || "Failed to generate."
      );
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!createTitle.trim() || !createDescription.trim()) {
      setCreateError("Title and description are required.");
      return;
    }
    if (!generatedTaskList.length) {
      setCreateError("Task list is empty.");
      return;
    }
    setCreateLoading(true);
    setCreateError("");
    try {
      await api.post("/tasks", {
        title: createTitle.trim(),
        description: createDescription.trim(),
        taskList: generatedTaskList,
      });
      setCreateOpen(false);
      setGeneratedTaskList([]);
      fetchTasks();
    } catch (err) {
      setCreateError(
        err.response?.data?.message || err.message || "Failed to create task."
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteClick = (task) => {
    setDeleteConfirmTask(task);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmTask) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/tasks/${deleteConfirmTask._id}`);
      setDeleteConfirmTask(null);
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openUpdateModal = (task) => {
    setUpdateTask(task);
    setUpdateTitle(task.title || "");
    setUpdateDescription(task.description || "");
    setUpdateTaskList(Array.isArray(task.taskList) ? [...task.taskList] : []);
    setUpdateError("");
    setUpdateLoading(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!updateTask) return;
    if (!updateTitle.trim() || !updateDescription.trim()) {
      setUpdateError("Title and description are required.");
      return;
    }
    setUpdateLoading(true);
    setUpdateError("");
    try {
      await api.put(`/tasks/${updateTask._id}`, {
        title: updateTitle.trim(),
        description: updateDescription.trim(),
        taskList: updateTaskList,
      });
      setUpdateTask(null);
      fetchTasks();
    } catch (err) {
      setUpdateError(
        err.response?.data?.message || err.message || "Failed to update."
      );
    } finally {
      setUpdateLoading(false);
    }
  };

  const updateTaskListItem = (index, field, value) => {
    const next = [...updateTaskList];
    if (!next[index]) next[index] = { userStory: "", engineeringTask: "" };
    next[index][field] = value;
    setUpdateTaskList(next);
  };

  const updateGeneratedTaskItem = (index, field, value) => {
    const next = [...generatedTaskList];
    if (!next[index]) next[index] = { userStory: "", engineeringTask: "" };
    next[index][field] = value;
    setGeneratedTaskList(next);
  };

  const addGeneratedTaskItem = () => {
    setGeneratedTaskList([...generatedTaskList, { userStory: "", engineeringTask: "" }]);
  };

  const removeGeneratedTaskItem = (index) => {
    setGeneratedTaskList(generatedTaskList.filter((_, i) => i !== index));
  };

  const addUpdateTaskItem = () => {
    setUpdateTaskList([...updateTaskList, { userStory: "", engineeringTask: "" }]);
  };

  const removeUpdateTaskItem = (index) => {
    setUpdateTaskList(updateTaskList.filter((_, i) => i !== index));
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    router.replace("/login");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            Tasks
          </h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:items-center">
            <input
              type="search"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2.5 text-white placeholder-slate-500 focus:border-amber-500/70 focus:outline-none focus:ring-2 focus:ring-amber-500/20 sm:min-w-[200px]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openGenerateModal}
                className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium py-2.5 px-5 transition-colors whitespace-nowrap"
              >
                Create task
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/50 font-medium py-2.5 px-5 transition-colors whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-400">Loading tasks...</p>
        ) : filteredTasks.length === 0 ? (
          <p className="text-slate-400">
            {searchQuery ? "No tasks match your search." : "No tasks yet. Create one to get started."}
          </p>
        ) : (
          <ul className="space-y-3">
            {filteredTasks.map((task) => (
              <li
                key={task._id}
                className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h2 className="font-medium text-white truncate">{task.title}</h2>
                  <p className="text-sm text-slate-400 line-clamp-2 mt-0.5">
                    {task.description}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openUpdateModal(task)}
                    className="rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700/50 font-medium py-2 px-4 text-sm transition-colors"
                  >
                    Update
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(task)}
                    className="rounded-lg border border-red-500/50 text-red-400 hover:bg-red-500/10 font-medium py-2 px-4 text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal 1: Generate task list */}
      {generateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !generateLoading && setGenerateOpen(false)}
        >
          <div
            className="rounded-2xl border border-slate-700/50 bg-slate-800 shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-white mb-4">
              Generate task list
            </h2>
            <form onSubmit={handleGenerate} className="space-y-4">
              {generateError && (
                <p className="text-sm text-red-400">{generateError}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Goal
                </label>
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2.5 text-white placeholder-slate-500 focus:border-amber-500/70 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  placeholder="e.g. Build a dashboard"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Users
                </label>
                <input
                  type="text"
                  value={users}
                  onChange={(e) => setUsers(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2.5 text-white placeholder-slate-500 focus:border-amber-500/70 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  placeholder="e.g. Admins, end users"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Constraints
                </label>
                <input
                  type="text"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2.5 text-white placeholder-slate-500 focus:border-amber-500/70 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  placeholder="e.g. Mobile-first, auth required"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => !generateLoading && setGenerateOpen(false)}
                  className="rounded-lg border border-slate-600 text-slate-300 px-4 py-2.5 font-medium hover:bg-slate-700/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generateLoading}
                  className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium px-4 py-2.5 disabled:opacity-50"
                >
                  {generateLoading ? "Generating with AI…" : "Generate with AI"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Create task (title, description, taskList from step 1) */}
      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={() => !createLoading && setCreateOpen(false)}
        >
          <div
            className="rounded-2xl border border-slate-700/50 bg-slate-800 shadow-xl w-full max-w-lg p-6 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-white mb-4">
              Create task
            </h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              {createError && (
                <p className="text-sm text-red-400">{createError}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2.5 text-white placeholder-slate-500 focus:border-amber-500/70 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  placeholder="Task title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2.5 text-white placeholder-slate-500 focus:border-amber-500/70 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-y"
                  placeholder="Task description"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Task list
                </label>
                <div className="space-y-3 max-h-48 overflow-y-auto rounded-lg border border-slate-600 bg-slate-900/40 p-3">
                  {generatedTaskList.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-slate-600 bg-slate-900/60 p-2 space-y-2 relative"
                    >
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Task title
                        </label>
                        <textarea
                          value={item.userStory || ""}
                          onChange={(e) =>
                            updateGeneratedTaskItem(i, "userStory", e.target.value)
                          }
                          placeholder="User story"
                          rows={3}
                          className="w-full rounded border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500/70 focus:outline-none resize-y"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Task description
                        </label>
                        <textarea
                          value={item.engineeringTask || ""}
                          onChange={(e) =>
                            updateGeneratedTaskItem(i, "engineeringTask", e.target.value)
                          }
                          placeholder="Engineering task"
                          rows={3}
                          className="w-full rounded border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500/70 focus:outline-none resize-y"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGeneratedTaskItem(i)}
                        className="absolute top-2 right-2 p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700/50"
                        title="Delete"
                        aria-label="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addGeneratedTaskItem}
                  className="mt-2 w-full rounded-lg border border-dashed border-slate-500 text-slate-400 py-2 text-sm font-medium hover:border-amber-500/50 hover:text-amber-400/90"
                >
                  + Add task
                </button>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => !createLoading && setCreateOpen(false)}
                  className="rounded-lg border border-slate-600 text-slate-300 px-4 py-2.5 font-medium hover:bg-slate-700/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium px-4 py-2.5 disabled:opacity-50"
                >
                  {createLoading ? "Creating…" : "Create task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Update task */}
      {updateTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          onClick={() => !updateLoading && setUpdateTask(null)}
        >
          <div
            className="rounded-2xl border border-slate-700/50 bg-slate-800 shadow-xl w-full max-w-lg p-6 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-white mb-4">
              Update task
            </h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              {updateError && (
                <p className="text-sm text-red-400">{updateError}</p>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={updateTitle}
                  onChange={(e) => setUpdateTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2.5 text-white focus:border-amber-500/70 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={updateDescription}
                  onChange={(e) => setUpdateDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2.5 text-white focus:border-amber-500/70 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-y"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Task list
                </label>
                <div className="space-y-3 max-h-48 overflow-y-auto rounded-lg border border-slate-600 bg-slate-900/40 p-3">
                  {updateTaskList.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-slate-600 bg-slate-900/60 p-2 space-y-2 relative"
                    >
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Task title
                        </label>
                        <textarea
                          value={item.userStory || ""}
                          onChange={(e) =>
                            updateTaskListItem(i, "userStory", e.target.value)
                          }
                          placeholder="User story"
                          rows={3}
                          className="w-full rounded border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500/70 focus:outline-none resize-y"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Task description
                        </label>
                        <textarea
                          value={item.engineeringTask || ""}
                          onChange={(e) =>
                            updateTaskListItem(i, "engineeringTask", e.target.value)
                          }
                          placeholder="Engineering task"
                          rows={3}
                          className="w-full rounded border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-amber-500/70 focus:outline-none resize-y"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeUpdateTaskItem(i)}
                        className="absolute top-2 right-2 p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-700/50"
                        title="Delete"
                        aria-label="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addUpdateTaskItem}
                  className="mt-2 w-full rounded-lg border border-dashed border-slate-500 text-slate-400 py-2 text-sm font-medium hover:border-amber-500/50 hover:text-amber-400/90"
                >
                  + Add task
                </button>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => !updateLoading && setUpdateTask(null)}
                  className="rounded-lg border border-slate-600 text-slate-300 px-4 py-2.5 font-medium hover:bg-slate-700/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateLoading}
                  className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium px-4 py-2.5 disabled:opacity-50"
                >
                  {updateLoading ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Delete confirm */}
      {deleteConfirmTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !deleteLoading && setDeleteConfirmTask(null)}
        >
          <div
            className="rounded-2xl border border-slate-700/50 bg-slate-800 shadow-xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-white mb-2">
              Delete task?
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              "{deleteConfirmTask.title || "Untitled"}" will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => !deleteLoading && setDeleteConfirmTask(null)}
                className="rounded-lg border border-slate-600 text-slate-300 px-4 py-2.5 font-medium hover:bg-slate-700/50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="rounded-lg bg-red-500 hover:bg-red-400 text-white font-medium px-4 py-2.5 disabled:opacity-50"
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
