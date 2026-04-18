import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const noise3D = /* glsl */ `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.,0.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;
    vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
    vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.0*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
    vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.0-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
    m=m*m;
    return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
`;

const vertexShader = /* glsl */ `
  ${noise3D}
  uniform float u_time;
  varying vec2 vUv;
  varying float vDisplacement;
  void main(){
    vUv = uv;
    float d = snoise(position * 0.8 + u_time * 0.3) * 0.3
            + snoise(position * 1.5 + u_time * 0.2) * 0.15;
    vDisplacement = d;
    vec3 pos = position + normal * d;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 u_colorA;
  uniform vec3 u_colorB;
  uniform vec3 u_colorC;
  varying vec2 vUv;
  varying float vDisplacement;
  void main(){
    float f = clamp((vDisplacement + 0.3) * 0.8 + vUv.y * 0.4, 0.0, 1.0);
    vec3 c = mix(u_colorA, u_colorB, smoothstep(0.0, 0.5, f));
    c = mix(c, u_colorC, smoothstep(0.5, 1.0, f));
    gl_FragColor = vec4(c, 0.2);
  }
`;

function Blob() {
  const mesh = useRef<THREE.Mesh>(null!);
  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_colorA: { value: new THREE.Color("#312e81") },  // indigo escuro
    u_colorB: { value: new THREE.Color("#6d28d9") },  // violet
    u_colorC: { value: new THREE.Color("#0891b2") },  // cyan escuro
  }), []);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    (mesh.current.material as THREE.ShaderMaterial).uniforms.u_time.value = clock.getElapsedTime();
    mesh.current.rotation.y = clock.getElapsedTime() * 0.06;
    mesh.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.1) * 0.08;
  });

  return (
    <mesh ref={mesh} scale={2} position={[0, -0.2, 0]}>
      <icosahedronGeometry args={[1, 48]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export function HeroBlob() {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true }}
      camera={{ position: [0, 0, 5], fov: 45 }}
      style={{ background: "transparent" }}
      dpr={[1, 1.5]}
    >
      <Blob />
    </Canvas>
  );
}
