import { Stars } from "@react-three/drei";

export default function SpaceStars() {
  return (
    <Stars
      radius={400}
      depth={120}
      count={15000}
      factor={6}
      saturation={0}
      fade
    />
  );
}