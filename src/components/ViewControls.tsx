import { useAppStore } from '../store/appStore';

export function ViewControls() {
  const viewYaw = useAppStore((s) => s.viewYaw);
  const viewTilt = useAppStore((s) => s.viewTilt);
  const viewZoom = useAppStore((s) => s.viewZoom);
  const rotateViewYaw = useAppStore((s) => s.rotateViewYaw);
  const setViewTilt = useAppStore((s) => s.setViewTilt);
  const setViewZoom = useAppStore((s) => s.setViewZoom);
  const resetView = useAppStore((s) => s.resetView);

  const yawDeg = Math.round(((viewYaw * 180) / Math.PI) % 360);

  return (
    <div className="view-controls" role="group" aria-label="Isometric view controls">
      <div className="vc-row">
        <button
          type="button"
          className="vc-btn"
          onClick={() => rotateViewYaw(-1)}
          aria-label="Rotate view counter-clockwise"
          title="Rotate left"
        >
          ⟲
        </button>
        <div className="vc-label" title="Yaw angle in degrees">
          {yawDeg}°
        </div>
        <button
          type="button"
          className="vc-btn"
          onClick={() => rotateViewYaw(1)}
          aria-label="Rotate view clockwise"
          title="Rotate right"
        >
          ⟳
        </button>
      </div>
      <div className="vc-row vc-tilt">
        <span className="vc-icon" aria-hidden="true">⤴︎</span>
        <input
          type="range"
          min="0.2"
          max="1.2"
          step="0.05"
          value={viewTilt}
          onChange={(e) => setViewTilt(Number(e.target.value))}
          aria-label="Tilt"
          title="Tilt"
        />
      </div>
      <div className="vc-row vc-zoom">
        <button
          type="button"
          className="vc-btn"
          onClick={() => setViewZoom(viewZoom * 1.15)}
          aria-label="Zoom in"
          title="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className="vc-btn"
          onClick={() => setViewZoom(viewZoom / 1.15)}
          aria-label="Zoom out"
          title="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          className="vc-btn vc-reset"
          onClick={resetView}
          aria-label="Reset view"
          title="Reset view"
        >
          ⟲
        </button>
      </div>
    </div>
  );
}