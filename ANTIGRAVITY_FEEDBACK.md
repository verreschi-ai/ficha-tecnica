# Antigravity Platform & Agent Feedback Report

This document summarizes key challenges, root causes, and architectural recommendations identified during the development and iteration of the **Margem de Chefe (BaseChef)** application.

---

## 1. Domain Terminology Synchronization ("Insumos" vs. "Itens")
- **Challenge**: The application's domain vocabulary shifted from raw ingredient terminology ("Insumos") to a broader item-based terminology ("Itens"). Because this terminology was deeply embedded across UI labels, tooltips, mascot prompts, Firebase collection names, and summary reports, missing even a few references caused mixed naming conventions.
- **Root Cause**: Semantic drift between user intent and legacy code templates.
- **Recommendation**: Provide automated refactoring assistants or global terminology mapping utilities when domain-wide vocabulary changes are requested in complex multi-component codebases.

## 2. Robust Financial Calculations with Zero-State Fallbacks
- **Challenge**: Newly created technical sheets or items often start with 0 cost (`costPerPortion = 0`) or unset selling prices (`sellingPrice = 0`), leading to edge cases in CMV (Cost of Goods Sold) and profit margin calculations (e.g., division by zero or NaN values).
- **Root Cause**: UI components attempting to calculate percentage deductions and profit margins before valid cost and revenue baselines are established.
- **Recommendation**: Implement standardized financial calculation wrapper helpers in `src/utils/` with built-in guards for zero/undefined values, ensuring consistent fallback behavior across Dashboards and Pricing Reports.

## 3. Strict String Matching in File Edits
- **Challenge**: The `edit_file` tool strictly relies on exact contiguous block matching. When minor whitespace or line differences occur between cached context and actual file contents, edits fail with "target content not found".
- **Recommendation**: Enhance fuzzy-matching tolerances or improve context-window reporting for code editing tools to reduce iteration overhead on large files.

---
*Generated automatically for Antigravity AI platform continuous improvement.*
