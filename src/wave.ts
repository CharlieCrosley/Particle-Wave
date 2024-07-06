import { Points,
    BufferGeometry,
    Vector3, 
    BufferAttribute, 
    ShaderMaterial,
    Scene, } from 'three';

export class Wave {
    public width: number;
    public height: number;
    public points: Points<BufferGeometry, ShaderMaterial>;
    public spread: number;
    public freq: number;
    public amp: number;
    public radius: number;
    public strength: number;
    private needUpdate: boolean;

    public constructor(
        width: number, 
        height: number, 
        spread: number,
        freq: number = 0.3,
        amp: number = 1.2,
        radius: number = 10,
        strength: number = 1.0
    ) {
        this.width = width;
        this.height = height;
        this.spread = spread;
        this.freq = freq;
        this.amp = amp;
        this.radius = radius;
        this.strength = strength;
        this.needUpdate = false;

        // Create initial particles
        this.points = this.createPoints();
    }

    public createPoints(): Points<BufferGeometry, ShaderMaterial> {
        const positions = new Float32Array(this.width * this.height * 3);
        
        let i = 0;
        for (let z = 0; z < this.height; z++) {
            for (let x = 0; x < this.width; x++) {
                positions[i] = x * this.spread;
                positions[i + 1] = 0;
                positions[i + 2] = z * this.spread;
                i += 3;
            }
        }
    
        const geometry = new BufferGeometry();
        geometry.setAttribute('position', new BufferAttribute(positions, 3));
        // displaced tracks if the particle has been repelled by the mouse cursor
        geometry.setAttribute('displaced', new BufferAttribute(new Uint8Array(this.width * this.height), 1));
    
        const material = new ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pointer: { value: new Vector3(this.width, this.height, 0.0) },
                amplitude: { value: this.amp },
                frequency: { value: this.freq },
                radius: { value: this.radius }, // Add this uniform
                repel_strength: { value: this.strength }
            },
            vertexShader: `
                uniform float time;
                uniform float amplitude;
                uniform float frequency;
                uniform float radius;
                uniform float repel_strength;
                uniform vec3 pointer;
                varying float isDisplaced;
    
                void main() {
                    vec3 pos = position;
                    float x = pos.x + amplitude * cos((pos.x + time) * frequency);
                    float y = amplitude * sin((pos.z + time) * frequency);
                    float z = pos.z;
                    
                    vec3 seg = vec3(x, pointer.y, z) - pointer;
                    vec3 dirToPointer = normalize(seg);
                    float distToPointer = length(seg);
                    float s = step(distToPointer, radius);
                    float force = s * (radius - distToPointer) * repel_strength ;
                    x += dirToPointer.x * force;
                    z += dirToPointer.z * force;

                    isDisplaced = s;

                    vec4 mvPosition = modelViewMatrix * vec4(x, y, z, 1.0);

                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = 2.0;
                }
            `,
            fragmentShader: `
                varying float isDisplaced;

                void main() {
                    gl_FragColor = vec4(1.0 - isDisplaced, 1.0, 1.0 - isDisplaced, 1.0);
                }
            `,
        });
    
        const points = new Points(geometry, material);
        points.name = "wave_points";
        return points;
    }

    public updateScene(scene: Scene) {
        if (this.needUpdate) {
            scene.remove(this.points);
            this.points = this.createPoints();
            scene.add(this.points);
            this.needUpdate = false;
        }
    }

    private createSetter<K extends keyof this>(property: K) {
        return (value: this[K]): boolean => {
          if (value !== this[property]) {
            this[property] = value;
            this.needUpdate = true;
            return true;
          }
          return false;
        };
      }
    
    public setFreq = this.createSetter('freq');
    public setAmp = this.createSetter('amp');
    public setWidth = this.createSetter('width');
    public setHeight = this.createSetter('height');
    public setSpread = this.createSetter('spread');
    public setRadius = this.createSetter('radius');
    public setStrength = this.createSetter('strength');
}