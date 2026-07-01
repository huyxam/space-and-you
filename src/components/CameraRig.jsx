import { useThree, useFrame } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function CameraRig({ isUserInteracting }) {

  const { camera } = useThree();

  const started = useRef(false);
  const timelineRef = useRef();
  const resumeTimeoutRef = useRef();

  useEffect(() => {

    if (started.current) return;

    started.current = true;

    const tl = gsap.timeline({
      repeat: -1
    });

    timelineRef.current = tl;

    tl.to(camera.position, {
      x: 8,
      y: 3,
      z: 15,
      duration: 10,
      ease: "power1.inOut"
    })

    .to(camera.position, {
      x: -8,
      y: 3,
      z: 15,
      duration: 10,
      ease: "power1.inOut"
    })

    .to(camera.position, {
      x: 0,
      y: 4.4,
      z: 13.5,
      duration: 10,
      ease: "power1.inOut"
    });

    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }
      tl.kill();
    };

  }, [camera]);

  useEffect(() => {
    if (!timelineRef.current) return;

    // If user starts interacting, pause the automatic camera animation
    if (isUserInteracting) {
      timelineRef.current.pause();

      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }

      return;
    }

    // When user interaction ends, resume after an idle delay
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }

    resumeTimeoutRef.current = setTimeout(() => {
      if (timelineRef.current) timelineRef.current.resume();
      resumeTimeoutRef.current = null;
    }, 8000); // 8 seconds idle before resuming

    return () => {
      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
        resumeTimeoutRef.current = null;
      }
    };

  }, [isUserInteracting]);

  useFrame(() => {
    camera.lookAt(0, 0, 0);
  });

  return null;
}