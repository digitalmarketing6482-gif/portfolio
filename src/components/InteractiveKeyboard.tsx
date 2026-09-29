import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader, DRACOLoader } from "three-stdlib";
import gsap from "gsap";
import { keyboardSound } from "../utils/keyboardSound";
import { FaVolumeHigh, FaVolumeXmark } from "react-icons/fa6";
import { MdOutlineRotateRight, MdKeyboard } from "react-icons/md";
import "./styles/InteractiveKeyboard.css";

const InteractiveKeyboard = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [switchType, setSwitchType] = useState<"thock" | "clicky">("thock");
  const [keystrokes, setKeystrokes] = useState(0);
  const [lastKey, setLastKey] = useState<string>("Space");
  const [isHovered, setIsHovered] = useState(false);

  // Three.js internal references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const keyboardGroupRef = useRef<THREE.Group | null>(null);
  const flashLightRef = useRef<THREE.PointLight | null>(null);
  const initialRotRef = useRef<{ x: number; y: number }>({ x: 0.55, y: -0.35 });

  const triggerKeyAction = useCallback((isBigKey: boolean, label?: string, hitPoint?: THREE.Vector3) => {
    keyboardSound.playKeyClick(isBigKey);
    setKeystrokes((prev) => prev + 1);
    if (label) setLastKey(label);

    // Light flash effect at point
    if (flashLightRef.current && hitPoint) {
      flashLightRef.current.position.set(hitPoint.x, hitPoint.y + 0.4, hitPoint.z);
      gsap.killTweensOf(flashLightRef.current);
      flashLightRef.current.intensity = 5;
      gsap.to(flashLightRef.current, {
        intensity: 0,
        duration: 0.25,
        ease: "power2.out",
      });
    }

    // Keyboard bounce/recoil animation
    if (keyboardGroupRef.current) {
      gsap.killTweensOf(keyboardGroupRef.current.position);
      gsap.to(keyboardGroupRef.current.position, {
        y: -0.06,
        duration: 0.04,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
      });
    }
  }, []);

  const handleMuteToggle = () => {
    const nextMuted = keyboardSound.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleSwitchChange = (type: "thock" | "clicky") => {
    keyboardSound.setSwitchType(type);
    setSwitchType(type);
    keyboardSound.playKeyClick(false);
  };

  const resetView = () => {
    if (keyboardGroupRef.current) {
      gsap.to(keyboardGroupRef.current.rotation, {
        x: initialRotRef.current.x,
        y: initialRotRef.current.y,
        z: 0,
        duration: 0.8,
        ease: "power3.out",
      });
    }
  };

  // Physical keyboard listener
  useEffect(() => {
    const handlePhysicalKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const isBig =
        e.code === "Space" ||
        e.code === "Enter" ||
        e.code === "Backspace" ||
        e.code.includes("Shift") ||
        e.code.includes("Control");

      const label = e.key === " " ? "SPACE" : e.key.length === 1 ? e.key.toUpperCase() : e.code;
      triggerKeyAction(isBig, label);
    };

    window.addEventListener("keydown", handlePhysicalKeyDown);
    return () => {
      window.removeEventListener("keydown", handlePhysicalKeyDown);
    };
  }, [triggerKeyAction]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 550;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 3.8, 4.8);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xd1c4e9, 1.3);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
    mainLight.position.set(5, 10, 6);
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(0xfb8dff, 2.2);
    rimLight.position.set(-6, 4, -4);
    scene.add(rimLight);

    const purpleFill = new THREE.DirectionalLight(0x7f40ff, 1.8);
    purpleFill.position.set(0, -4, 5);
    scene.add(purpleFill);

    const flashLight = new THREE.PointLight(0xc2a4ff, 0, 4);
    flashLight.position.set(0, 1, 0);
    scene.add(flashLight);
    flashLightRef.current = flashLight;

    // 5. Keyboard Group
    const keyboardGroup = new THREE.Group();
    scene.add(keyboardGroup);
    keyboardGroupRef.current = keyboardGroup;

    // Set initial flattering angle
    keyboardGroup.rotation.x = initialRotRef.current.x;
    keyboardGroup.rotation.y = initialRotRef.current.y;

    // 6. GLTF Loader
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      "/models/keyboard.glb",
      (gltf) => {
        const model = gltf.scene;

        // Auto-center & compute scale
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.position.x -= center.x;
        model.position.y -= center.y;
        model.position.z -= center.z;

        // Fit nicely into view
        const maxDim = Math.max(size.x, size.y, size.z);
        const desiredScale = 3.6 / maxDim;
        keyboardGroup.scale.setScalar(desiredScale);

        // Enhance materials
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const mat = mesh.material as THREE.MeshStandardMaterial;
              mat.roughness = Math.min(mat.roughness, 0.45);
              mat.metalness = Math.max(mat.metalness, 0.2);
              mat.needsUpdate = true;
            }
          }
        });

        keyboardGroup.add(model);
        setLoading(false);
        dracoLoader.dispose();
      },
      undefined,
      (error) => {
        console.error("Error loading keyboard GLB:", error);
        setLoading(false);
      }
    );

    // 7. Raycasting & Interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let didDrag = false;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      didDrag = false;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      prevMousePos = { x: clientX, y: clientY };
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      if (isDragging && keyboardGroupRef.current) {
        const deltaX = clientX - prevMousePos.x;
        const deltaY = clientY - prevMousePos.y;

        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
          didDrag = true;
        }

        keyboardGroupRef.current.rotation.y += deltaX * 0.008;
        keyboardGroupRef.current.rotation.x += deltaY * 0.008;
        // Clamp X tilt to comfortable viewing range
        keyboardGroupRef.current.rotation.x = THREE.MathUtils.clamp(
          keyboardGroupRef.current.rotation.x,
          0.15,
          1.1
        );

        prevMousePos = { x: clientX, y: clientY };
      }
    };

    const onPointerUp = (e: MouseEvent | TouchEvent) => {
      if (!didDrag && container) {
        const rect = container.getBoundingClientRect();
        const clientX = "changedTouches" in e ? e.changedTouches[0].clientX : (e as MouseEvent).clientX;
        const clientY = "changedTouches" in e ? e.changedTouches[0].clientY : (e as MouseEvent).clientY;

        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

        if (cameraRef.current && keyboardGroupRef.current) {
          raycaster.setFromCamera(mouse, cameraRef.current);
          const intersects = raycaster.intersectObjects(keyboardGroupRef.current.children, true);

          if (intersects.length > 0) {
            const hit = intersects[0];
            const hitMeshName = hit.object.name || "";
            const materialName = (hit.object as any).material?.name || "";

            const isBig =
              hitMeshName.includes("Big") ||
              materialName.includes("Big") ||
              hit.point.y < -0.1 ||
              Math.abs(hit.point.x) < 0.4;

            const keyName = isBig ? "SPACE / ENTER" : "KEYCAP";
            triggerKeyAction(isBig, keyName, hit.point);
          } else {
            // General click near keyboard
            triggerKeyAction(false, "CLICK");
          }
        }
      }
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener("mousedown", onPointerDown);
    domEl.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchend", onPointerUp);

    // 8. Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || 550;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener("resize", handleResize);

    // 9. Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Subtle resting float when idle
      if (!isDragging && keyboardGroupRef.current) {
        keyboardGroupRef.current.position.y = Math.sin(elapsedTime * 1.5) * 0.03;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      domEl.removeEventListener("mousedown", onPointerDown);
      domEl.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchend", onPointerUp);
      renderer.dispose();
      if (domEl && container.contains(domEl)) {
        container.removeChild(domEl);
      }
    };
  }, [triggerKeyAction]);

  return (
    <div
      className="keyboard-section section-container"
      id="keyboard"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="keyboard-header">
        <div className="keyboard-badge">
          <MdKeyboard /> INTERACTIVE 3D MECHANICAL KEYBOARD
        </div>
        <h2>
          Tap Keys <span>&amp;</span> Hear The Clack
        </h2>
        <p>
          Click any key on the 3D aesthetic keyboard or type anywhere on your keyboard to test
          custom mechanical switches with zero latency audio!
        </p>
      </div>

      <div className="keyboard-container">
        {loading && (
          <div className="keyboard-loading">
            <div className="keyboard-spinner"></div>
            <span>Loading 3D Aesthetic Keyboard...</span>
          </div>
        )}

        <div className="keyboard-canvas-wrap" ref={mountRef}>
          {/* Top HUD Controls */}
          <div className="keyboard-hud">
            <div className="keyboard-stats">
              <span className="stat-pill">
                Keystrokes: <strong>{keystrokes}</strong>
              </span>
              <span className="stat-pill key-pill">
                Key: <strong>{lastKey}</strong>
              </span>
            </div>

            <div className="keyboard-controls">
              {/* Switch Sound Type */}
              <div className="switch-toggle-group">
                <button
                  className={`switch-btn ${switchType === "thock" ? "active" : ""}`}
                  onClick={() => handleSwitchChange("thock")}
                  title="Deep Thock (Boba U4T / Holy Panda)"
                  data-cursor="disable"
                >
                  Creamy Thock
                </button>
                <button
                  className={`switch-btn ${switchType === "clicky" ? "active" : ""}`}
                  onClick={() => handleSwitchChange("clicky")}
                  title="Tactile Clicky (Cherry MX Blue)"
                  data-cursor="disable"
                >
                  Clicky Blue
                </button>
              </div>

              {/* Reset View */}
              <button
                className="icon-tool-btn"
                onClick={resetView}
                title="Reset Camera View"
                data-cursor="disable"
              >
                <MdOutlineRotateRight />
              </button>

              {/* Mute Toggle */}
              <button
                className={`icon-tool-btn ${isMuted ? "muted" : ""}`}
                onClick={handleMuteToggle}
                title={isMuted ? "Unmute Sound" : "Mute Sound"}
                data-cursor="disable"
              >
                {isMuted ? <FaVolumeXmark /> : <FaVolumeHigh />}
              </button>
            </div>
          </div>

          {/* Bottom Hint */}
          <div className={`keyboard-hint ${isHovered ? "hint-active" : ""}`}>
            <span>🖱️ Drag to rotate &bull; 👆 Click keys to click &bull; ⌨️ Type on keyboard</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveKeyboard;
