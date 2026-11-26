# Day 11 Shared — Reactor Graph Parser

Shared domain parser for Advent of Code 2025 Day 11 ("Reactor").

## Consumer Guide

- `parseReactorGraph(raw)`: Parses `device: out1 out2 ...` lines into a frozen `DirectedGraph<string>`, ignoring blank lines, supporting explicit sinks (`out:`), and registering implicit sinks.

## Maintainer Notes

- Validates `^[A-Za-z0-9_-]+$` for both source and target device names, rejecting empty inputs, malformed lines, invalid target tokens, and duplicate device definitions.
- Pure TypeScript with zero React/DOM dependencies.
