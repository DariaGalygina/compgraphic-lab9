class Point3D {
    constructor(x, y, z) {
        this.x = x; this.y = y; this.z = z;
    }
    subtract(other) {
        return new Point3D(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    add(other) {
        return new Point3D(this.x + other.x, this.y + other.y, this.z + other.z);
    }
    multiply(scalar) {
        return new Point3D(this.x * scalar, this.y * scalar, this.z * scalar);
    }
    cross(other) {
        return new Point3D(
            this.y * other.z - this.z * other.y,
            this.z * other.x - this.x * other.z,
            this.x * other.y - this.y * other.x
        );
    }
    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    normalize() {
        const len = this.length();
        return len > 0 ? new Point3D(this.x/len, this.y/len, this.z/len) : this;
    }
}

class Vertex {
    constructor(position, normal = null, texCoord = null) {
        this.position = position;
        this.normal = normal || new Point3D(0, 0, 0);
        this.texCoord = texCoord || { u: 0, v: 0 };
    }
}

class Face {
    constructor(vertexIndices, color = null) {
        this.vertexIndices = vertexIndices;
        this.color = color || { r: 0.8, g: 0.6, b: 0.4 };
        this.normal = new Point3D(0, 0, 0);
    }
    
    calculateNormal(vertices) {
        if (this.vertexIndices.length < 3) return new Point3D(0, 0, 1);
        const v0 = vertices[this.vertexIndices[0]].position;
        const v1 = vertices[this.vertexIndices[1]].position;
        const v2 = vertices[this.vertexIndices[2]].position;
        const vec1 = v1.subtract(v0);
        const vec2 = v2.subtract(v0);
        this.normal = vec1.cross(vec2).normalize();
        return this.normal;
    }
}

class Model3D {
    constructor(vertices, faces) {
        this.vertices = vertices;
        this.faces = faces.map(f => new Face(f));
        this.calculateVertexNormals();
    }
    
    calculateVertexNormals() {
        this.vertices.forEach(v => v.normal = new Point3D(0, 0, 0));
        this.faces.forEach(face => {
            const normal = face.calculateNormal(this.vertices);
            face.vertexIndices.forEach(idx => {
                this.vertices[idx].normal = this.vertices[idx].normal.add(normal);
            });
        });
        this.vertices.forEach(v => v.normal = v.normal.normalize());
    }
}

class Lighting3DViewer {
    constructor() {
        this.canvas = document.getElementById('renderCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.currentModel = 'cube';
        this.shadingMode = 'gouraud';
        this.enableTexturing = false;
        this.textureType = 'checker';
        
        this.lightPosition = new Point3D(2, 2, 2);
        this.ambientIntensity = 0.2;
        this.diffuseIntensity = 0.7;
        this.objectColor = { r: 0.8, g: 0.6, b: 0.4 };
        
        this.rotation = { x: 0, y: 0, z: 0 };
        this.scale = 1.0;
        
        this.zBuffer = new Array(this.canvas.width * this.canvas.height);
        
        this.models = this.createModels();
        this.setupEventListeners();
        this.render();
    }
    
    createModels() {
        // Cube
        const cubeVertices = [
            new Vertex(new Point3D(-1, -1, -1)), new Vertex(new Point3D(1, -1, -1)), 
            new Vertex(new Point3D(1, 1, -1)), new Vertex(new Point3D(-1, 1, -1)),
            new Vertex(new Point3D(-1, -1, 1)), new Vertex(new Point3D(1, -1, 1)), 
            new Vertex(new Point3D(1, 1, 1)), new Vertex(new Point3D(-1, 1, 1))
        ];
        cubeVertices[0].texCoord = { u: 0, v: 1 }; cubeVertices[1].texCoord = { u: 1, v: 1 };
        cubeVertices[2].texCoord = { u: 1, v: 0 }; cubeVertices[3].texCoord = { u: 0, v: 0 };
        cubeVertices[4].texCoord = { u: 0, v: 1 }; cubeVertices[5].texCoord = { u: 1, v: 1 };
        cubeVertices[6].texCoord = { u: 1, v: 0 }; cubeVertices[7].texCoord = { u: 0, v: 0 };
        
        const cubeFaces = [
            [0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4],
            [2, 3, 7, 6], [0, 4, 7, 3], [1, 2, 6, 5]
        ];
        
        // Sphere
        const sphereVertices = [];
        const sphereFaces = [];
        const slices = 12, stacks = 8;
        for (let i = 0; i <= stacks; i++) {
            const phi = Math.PI * i / stacks;
            const sinPhi = Math.sin(phi), cosPhi = Math.cos(phi);
            for (let j = 0; j <= slices; j++) {
                const theta = 2 * Math.PI * j / slices;
                sphereVertices.push(new Vertex(new Point3D(
                    sinPhi * Math.cos(theta), cosPhi, sinPhi * Math.sin(theta)
                ), null, { u: j / slices, v: i / stacks }));
            }
        }
        for (let i = 0; i < stacks; i++) {
            for (let j = 0; j < slices; j++) {
                const first = i * (slices + 1) + j;
                sphereFaces.push([first, first + 1, first + slices + 2, first + slices + 1]);
            }
        }
        
        // Tetrahedron
        const tetraVertices = [
            new Vertex(new Point3D(0, 1, 0), null, { u: 0.5, v: 1 }),
            new Vertex(new Point3D(0.87, -0.5, 0), null, { u: 1, v: 0 }),
            new Vertex(new Point3D(-0.87, -0.5, 0), null, { u: 0, v: 0 }),
            new Vertex(new Point3D(0, 0, 1.41), null, { u: 0.5, v: 0.5 })
        ];
        const tetraFaces = [[0, 2, 1], [0, 1, 3], [0, 3, 2], [1, 2, 3]];
        
        // Octahedron
        const octaVertices = [
            new Vertex(new Point3D(0, 1, 0)), new Vertex(new Point3D(1, 0, 0)),
            new Vertex(new Point3D(0, 0, 1)), new Vertex(new Point3D(-1, 0, 0)),
            new Vertex(new Point3D(0, 0, -1)), new Vertex(new Point3D(0, -1, 0))
        ];
        const octaFaces = [
            [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1],
            [5, 2, 1], [5, 3, 2], [5, 4, 3], [5, 1, 4]
        ];
        
        return {
            cube: new Model3D(cubeVertices, cubeFaces),
            sphere: new Model3D(sphereVertices, sphereFaces),
            tetrahedron: new Model3D(tetraVertices, tetraFaces),
            octahedron: new Model3D(octaVertices, octaFaces)
        };
    }
    
    setupEventListeners() {
        document.getElementById('modelSelect').addEventListener('change', (e) => {
            this.currentModel = e.target.value;
        });
        document.getElementById('shadingMode').addEventListener('change', (e) => {
            this.shadingMode = e.target.value;
        });
        document.getElementById('texturing').addEventListener('change', (e) => {
            this.enableTexturing = e.target.checked;
        });
        document.getElementById('textureSelect').addEventListener('change', (e) => {
            this.textureType = e.target.value;
        });
        
        // Lighting controls
        ['lightX', 'lightY', 'lightZ'].forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                this.lightPosition[id.replace('light', '').toLowerCase()] = parseFloat(e.target.value);
                document.getElementById(id + 'Value').textContent = e.target.value;
            });
        });
        
        document.getElementById('ambient').addEventListener('input', (e) => {
            this.ambientIntensity = parseFloat(e.target.value);
            document.getElementById('ambientValue').textContent = e.target.value;
        });
        
        document.getElementById('diffuse').addEventListener('input', (e) => {
            this.diffuseIntensity = parseFloat(e.target.value);
            document.getElementById('diffuseValue').textContent = e.target.value;
        });
        
        // Transform controls
        ['rotateX', 'rotateY', 'rotateZ'].forEach(id => {
            document.getElementById(id).addEventListener('input', (e) => {
                this.rotation[id.replace('rotate', '').toLowerCase()] = parseFloat(e.target.value) * Math.PI / 180;
                document.getElementById(id + 'Value').textContent = e.target.value + '°';
            });
        });
        
        document.getElementById('scale').addEventListener('input', (e) => {
            this.scale = parseFloat(e.target.value);
            document.getElementById('scaleValue').textContent = e.target.value;
        });
    }
    
    rotatePoint(point, rx, ry, rz) {
        let x = point.x, y = point.y, z = point.z;
        if (rx !== 0) {
            const cosX = Math.cos(rx), sinX = Math.sin(rx);
            [y, z] = [y * cosX - z * sinX, y * sinX + z * cosX];
        }
        if (ry !== 0) {
            const cosY = Math.cos(ry), sinY = Math.sin(ry);
            [x, z] = [x * cosY + z * sinY, -x * sinY + z * cosY];
        }
        if (rz !== 0) {
            const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
            [x, y] = [x * cosZ - y * sinZ, x * sinZ + y * cosZ];
        }
        return new Point3D(x, y, z);
    }
    
    calculateLighting(normal) {
        const normNormal = normal.normalize();
        const lightDir = this.lightPosition.normalize();
        const diffuse = Math.max(normNormal.dot(lightDir), 0);
        return Math.min(this.ambientIntensity + this.diffuseIntensity * diffuse, 1.0);
    }
    
    getTextureColor(u, v) {
        switch (this.textureType) {
            case 'checker':
                return (Math.floor(u * 4) % 2 === Math.floor(v * 4) % 2) ? 
                    { r: 1, g: 0, b: 0 } : { r: 0, g: 0, b: 1 };
            case 'gradient':
                return { r: u, g: v, b: (1 - u) * (1 - v) };
            case 'stripes':
                return (Math.floor(u * 8) % 2 === 0) ? 
                    { r: 1, g: 1, b: 0 } : { r: 0, g: 1, b: 1 };
            default: return { r: 1, g: 1, b: 1 };
        }
    }
    
    clearZBuffer() {
        for (let i = 0; i < this.zBuffer.length; i++) {
            this.zBuffer[i] = Number.MAX_VALUE;
        }
    }
    
    drawTriangle(v1, v2, v3) {
        const minX = Math.max(0, Math.floor(Math.min(v1.x, v2.x, v3.x)));
        const maxX = Math.min(this.canvas.width - 1, Math.ceil(Math.max(v1.x, v2.x, v3.x)));
        const minY = Math.max(0, Math.floor(Math.min(v1.y, v2.y, v3.y)));
        const maxY = Math.min(this.canvas.height - 1, Math.ceil(Math.max(v1.y, v2.y, v3.y)));
        
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const denom = (v2.y - v3.y) * (v1.x - v3.x) + (v3.x - v2.x) * (v1.y - v3.y);
                if (Math.abs(denom) < 0.0001) continue;
                
                const lambda1 = ((v2.y - v3.y) * (x - v3.x) + (v3.x - v2.x) * (y - v3.y)) / denom;
                const lambda2 = ((v3.y - v1.y) * (x - v3.x) + (v1.x - v3.x) * (y - v3.y)) / denom;
                const lambda3 = 1 - lambda1 - lambda2;
                
                if (lambda1 >= 0 && lambda2 >= 0 && lambda3 >= 0) {
                    const z = lambda1 * v1.z + lambda2 * v2.z + lambda3 * v3.z;
                    const bufferIndex = y * this.canvas.width + x;
                    
                    if (z < this.zBuffer[bufferIndex] && z > 0) {
                        this.zBuffer[bufferIndex] = z;
                        
                        let color;
                        if (this.shadingMode === 'flat') {
                            color = v1.color;
                        } else if (this.shadingMode === 'gouraud') {
                            const r = lambda1 * v1.color.r + lambda2 * v2.color.r + lambda3 * v3.color.r;
                            const g = lambda1 * v1.color.g + lambda2 * v2.color.g + lambda3 * v3.color.g;
                            const b = lambda1 * v1.color.b + lambda2 * v2.color.b + lambda3 * v3.color.b;
                            color = { r, g, b };
                        } else {
                            const nx = lambda1 * v1.normal.x + lambda2 * v2.normal.x + lambda3 * v3.normal.x;
                            const ny = lambda1 * v1.normal.y + lambda2 * v2.normal.y + lambda3 * v3.normal.y;
                            const nz = lambda1 * v1.normal.z + lambda2 * v2.normal.z + lambda3 * v3.normal.z;
                            const intensity = this.calculateLighting(new Point3D(nx, ny, nz));
                            color = {
                                r: this.objectColor.r * intensity,
                                g: this.objectColor.g * intensity,
                                b: this.objectColor.b * intensity
                            };
                        }
                        
                        if (this.enableTexturing) {
                            const u = lambda1 * v1.texCoord.u + lambda2 * v2.texCoord.u + lambda3 * v3.texCoord.u;
                            const v = lambda1 * v1.texCoord.v + lambda2 * v2.texCoord.v + lambda3 * v3.texCoord.v;
                            const texColor = this.getTextureColor(u, v);
                            color.r *= texColor.r; color.g *= texColor.g; color.b *= texColor.b;
                        }
                        
                        this.ctx.fillStyle = `rgb(${color.r * 255},${color.g * 255},${color.b * 255})`;
                        this.ctx.fillRect(x, y, 1, 1);
                    }
                }
            }
        }
    }
    
    render() {
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.clearZBuffer();
        
        const model = this.models[this.currentModel];
        document.getElementById('faceCount').textContent = model.faces.length;
        document.getElementById('vertexCount').textContent = model.vertices.length;
        
        const transformedVertices = model.vertices.map(vertex => {
            const rotated = this.rotatePoint(vertex.position, this.rotation.x, this.rotation.y, this.rotation.z);
            const scaled = rotated.multiply(this.scale);
            return {
                x: scaled.x * 100 + this.canvas.width / 2,
                y: -scaled.y * 100 + this.canvas.height / 2,
                z: scaled.z,
                normal: vertex.normal,
                texCoord: vertex.texCoord,
                color: { r: 0, g: 0, b: 0 }
            };
        });
        
        if (this.shadingMode === 'gouraud') {
            transformedVertices.forEach((v, i) => {
                const intensity = this.calculateLighting(model.vertices[i].normal);
                v.color = {
                    r: this.objectColor.r * intensity,
                    g: this.objectColor.g * intensity,
                    b: this.objectColor.b * intensity
                };
            });
        }
        
        model.faces.forEach(face => {
            const vertices = face.vertexIndices.map(idx => transformedVertices[idx]);
            
            if (this.shadingMode === 'flat') {
                const normal = face.calculateNormal(model.vertices.map(v => v.position));
                const intensity = this.calculateLighting(normal);
                vertices.forEach(v => {
                    v.color = {
                        r: this.objectColor.r * intensity,
                        g: this.objectColor.g * intensity,
                        b: this.objectColor.b * intensity
                    };
                });
            }
            
            if (vertices.length === 3) {
                this.drawTriangle(vertices[0], vertices[1], vertices[2]);
            } else if (vertices.length === 4) {
                this.drawTriangle(vertices[0], vertices[1], vertices[2]);
                this.drawTriangle(vertices[0], vertices[2], vertices[3]);
            }
        });
        
        requestAnimationFrame(() => this.render());
    }
}

window.addEventListener('load', () => {
    new Lighting3DViewer();
});