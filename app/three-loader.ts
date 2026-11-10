/** Three.js is loaded on demand so the text content never waits for the 3D bundle. */
export const loadThree = () => import("three");
