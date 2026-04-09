import type { CSSProperties } from "react"

export type DiffMode = "inline" | "side-by-side"
export type DiffLineKind = "added" | "removed" | "context" | "skipped"

export interface DiffLine {
  kind: DiffLineKind
  lineNum: string
  content: string
}

export type HastText = { type: "text"; value: string }
export type HastElement = {
  type: "element"
  tagName: string
  properties: { className?: string[] }
  children: HastNode[]
}
export type HastNode = HastText | HastElement

export type FlatToken = { classNames: string[]; text: string }
export type ThemeStyle = Record<string, CSSProperties>

export interface HighlightMap {
  newLines: FlatToken[][]
  oldLines: FlatToken[][]
  newLineIndex: number[]
  oldLineIndex: number[]
}
