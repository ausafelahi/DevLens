"use client";

import { useState } from "react";

type TreeNode = {
  name: string;
  path: string;
  isFile: boolean;
  children: Map<string, TreeNode>;
};

function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = {
    name: "",
    path: "",
    isFile: false,
    children: new Map(),
  };
  for (const path of paths) {
    const parts = path.split("/");
    let current = root;
    let accPath = "";
    parts.forEach((part, i) => {
      accPath = accPath ? `${accPath}/${part}` : part;
      const isFile = i === parts.length - 1;
      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          path: accPath,
          isFile,
          children: new Map(),
        });
      }
      current = current.children.get(part)!;
    });
  }
  return root;
}

const EXT_ICON: Record<string, string> = {
  ts: "◆",
  tsx: "◆",
  js: "◇",
  jsx: "◇",
  py: "●",
  json: "◈",
  md: "▤",
};

function iconFor(name: string) {
  const ext = name.slice(name.lastIndexOf(".") + 1);
  return EXT_ICON[ext] ?? "○";
}

function TreeRow({
  node,
  depth,
  onSelectFile,
  selectedPath,
}: {
  node: TreeNode;
  depth: number;
  onSelectFile?: (path: string) => void;
  selectedPath?: string;
}) {
  const [open, setOpen] = useState(depth < 1);
  const sorted = [...node.children.values()].sort((a, b) => {
    if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  if (node.isFile) {
    return (
      <button
        onClick={() => onSelectFile?.(node.path)}
        disabled={!onSelectFile}
        className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left font-mono text-xs transition-colors ${
          selectedPath === node.path
            ? "bg-[#E8A33D]/15 text-[#E8A33D]"
            : "text-[#8B90A3] hover:bg-[#1F2330] hover:text-[#EDEAE0]"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <span className="text-[#E8A33D]">{iconFor(node.name)}</span>
        {node.name}
      </button>
    );
  }

  return (
    <div>
      {node.name && (
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center gap-2 rounded px-2 py-1 font-mono text-xs text-[#EDEAE0] transition-colors hover:bg-[#1F2330]"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <span
            className="inline-block text-[#8B90A3] transition-transform duration-150"
            style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ▸
          </span>
          <span className="font-medium">{node.name}/</span>
        </button>
      )}
      {open &&
        sorted.map((child) => (
          <TreeRow
            key={child.path}
            node={child}
            depth={depth + 1}
            onSelectFile={onSelectFile}
            selectedPath={selectedPath}
          />
        ))}
    </div>
  );
}

export function FileTree({
  paths,
  onSelectFile,
  selectedPath,
}: {
  paths: string[];
  onSelectFile?: (path: string) => void;
  selectedPath?: string;
}) {
  const tree = buildTree(paths);
  return (
    <div className="max-h-96 overflow-y-auto rounded-xl border border-[#262A38] bg-[#0F1119] p-2">
      <TreeRow
        node={tree}
        depth={-1}
        onSelectFile={onSelectFile}
        selectedPath={selectedPath}
      />
    </div>
  );
}
