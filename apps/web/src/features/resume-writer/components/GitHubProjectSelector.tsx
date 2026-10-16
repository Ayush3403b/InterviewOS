import React, { useState } from "react";
import axios from "axios";

import { fetchGitHubRepos } from "../api";

export interface SelectedGitHubProject {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
  stars?: number;
}

interface GitHubProjectSelectorProps {
  githubUsername: string;
  onUsernameChange: (username: string) => void;
  selectedProjects: SelectedGitHubProject[];
  onSelectedProjectsChange: (projects: SelectedGitHubProject[]) => void;
  maxProjects?: number;
}

export const GitHubProjectSelector: React.FC<GitHubProjectSelectorProps> = ({
  githubUsername,
  onUsernameChange,
  selectedProjects,
  onSelectedProjectsChange,
  maxProjects = 3,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoFilter, setRepoFilter] = useState("");
  const [repos, setRepos] = useState<
    Array<{
      name: string;
      description: string;
      language: string;
      stars: number;
      url: string;
      topics: string[];
    }>
  >([]);
  const [hasFetched, setHasFetched] = useState(false);

  const handleFetch = async () => {
    if (!githubUsername.trim()) {
      setError("Please enter a valid GitHub username.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetched = await fetchGitHubRepos(githubUsername.trim());
      setRepos(fetched);
      setHasFetched(true);
    } catch (err) {
      const body = axios.isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)
        : undefined;
      setError(
        body?.message ||
          "Failed to fetch repositories. Please check the username or try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (repo: {
    name: string;
    description: string;
    language: string;
    stars: number;
    url: string;
    topics: string[];
  }) => {
    const isSelected = selectedProjects.some((p) => p.name === repo.name);

    if (isSelected) {
      onSelectedProjectsChange(selectedProjects.filter((p) => p.name !== repo.name));
    } else {
      if (selectedProjects.length >= maxProjects) {
        return;
      }

      const techList = [
        ...(repo.language ? [repo.language] : []),
        ...(repo.topics || []),
      ];

      onSelectedProjectsChange([
        ...selectedProjects,
        {
          name: repo.name,
          description: repo.description || `Open source project: ${repo.name}`,
          technologies: techList.length > 0 ? techList : ["Software Development"],
          url: repo.url,
          stars: repo.stars,
        },
      ]);
    }
  };

  const filteredRepos = repos.filter(
    (r) =>
      r.name.toLowerCase().includes(repoFilter.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(repoFilter.toLowerCase())) ||
      (r.language && r.language.toLowerCase().includes(repoFilter.toLowerCase()))
  );

  return (
    <div className="space-y-3 p-4 rounded-xl border border-slate-700/60 bg-slate-900/60">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
          GitHub Integration <span className="text-slate-500 font-normal lowercase">(optional)</span>
        </label>
        {hasFetched && (
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
              selectedProjects.length > 0
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-slate-800 text-slate-400 border border-slate-700"
            }`}
          >
            {selectedProjects.length}/{maxProjects} Selected
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-sm">
            github.com/
          </span>
          <input
            type="text"
            value={githubUsername}
            onChange={(e) => onUsernameChange(e.target.value)}
            placeholder="octocat"
            className="w-full pl-24 pr-3 py-2 text-sm bg-slate-950/70 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>
        <button
          type="button"
          onClick={handleFetch}
          disabled={loading || !githubUsername.trim()}
          className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Fetching All Repos...
            </>
          ) : (
            "Fetch All Repos"
          )}
        </button>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      {hasFetched && repos.length === 0 && !error && (
        <p className="text-xs text-slate-400">No public repositories found for this account.</p>
      )}

      {repos.length > 0 && (
        <div className="space-y-2 mt-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Found <strong className="text-slate-200">{repos.length}</strong> repositories. Select project(s) to add with full ATS descriptions:
            </span>
            {repos.length > 4 && (
              <input
                type="text"
                value={repoFilter}
                onChange={(e) => setRepoFilter(e.target.value)}
                placeholder="Filter repos..."
                className="w-32 px-2 py-0.5 text-[11px] bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {filteredRepos.map((repo) => {
              const isSelected = selectedProjects.some((p) => p.name === repo.name);
              const isDisabled = !isSelected && selectedProjects.length >= maxProjects;

              return (
                <div
                  key={repo.name}
                  onClick={() => !isDisabled && toggleSelect(repo)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? "bg-indigo-950/50 border-indigo-500 ring-1 ring-indigo-500/50"
                      : isDisabled
                      ? "bg-slate-950/40 border-slate-800 opacity-50 cursor-not-allowed"
                      : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isDisabled}
                          onChange={() => toggleSelect(repo)}
                          className="h-3.5 w-3.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 bg-slate-900"
                        />
                        <span className="text-xs font-semibold text-slate-200 truncate">{repo.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                        {repo.description || "Open source project repository."}
                      </p>
                    </div>
                    {repo.stars > 0 && (
                      <span className="text-[10px] text-amber-400 shrink-0 flex items-center gap-0.5 font-mono">
                        ⭐ {repo.stars}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mt-2">
                    {repo.language && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono">
                        {repo.language}
                      </span>
                    )}
                    {repo.topics?.slice(0, 3).map((topic) => (
                      <span
                        key={topic}
                        className="text-[10px] px-1.5 py-0.5 bg-slate-800/80 text-indigo-300 rounded border border-slate-700/60"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
