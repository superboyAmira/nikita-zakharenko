"use client";
import { useEffect, useRef, useState } from "react";
import { createScene, type SceneHandle } from "./scene";
import { loadThree } from "./three-loader";

const MODELS = ["bot", "database", "network", "conversation"];

export default function Blob({ moving, slide }: { moving: boolean; slide: number }) {
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<SceneHandle | null>(null);
  const latest = useRef({ moving, slide });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    latest.current = { moving, slide };
    handle.current?.setMotion(moving);
    handle.current?.setSlide(slide);
  }, [moving, slide]);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let cancelled = false;
    loadThree()
      .then(T => {
        if (cancelled) return;
        const scene = createScene(T, container, { slide: latest.current.slide, motion: latest.current.moving });
        if (!scene) return; // No WebGL: the static fallback stays.
        handle.current = scene;
        setReady(true);
      })
      .catch(() => { /* Three.js failed to load: the static fallback stays. */ });
    return () => { cancelled = true; handle.current?.dispose(); handle.current = null; };
  }, []);

  return (
    <div ref={host} className={`blob${ready ? " is-ready" : ""}`} data-model={MODELS[slide]} aria-hidden="true">
      <div className="blob-fallback" />
    </div>
  );
}
