// This file exists solely to co-locate the jodit CSS import with the
// jodit-react component import in a single module that can be dynamically
// loaded client-side. This prevents SSR from trying to resolve the CSS
// which references browser-only resources and causes Turbopack failures.
import "jodit/es2021/jodit.min.css";
export { default } from "jodit-react";
